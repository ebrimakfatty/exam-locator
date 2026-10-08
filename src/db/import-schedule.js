// ==========================================================
// IMPORT EXAM SCHEDULE
// ==========================================================
//
// Loads the Fergusson College exam schedule from CSV.
//
// IMPORTANT:
// - Does NOT delete existing exams.
// - Does NOT change existing room assignments.
// - Does NOT insert duplicate examinations.
// - Safe to run multiple times.
//
// Run:
// npm run db:import-schedule
// ==========================================================

const fs = require('fs');
const path = require('path');
const db = require('./index');

const CSV_PATH = path.join(__dirname, 'seed_exam_schedule.csv');


// ==========================================================
// CSV PARSER
// ==========================================================

function parseCsv(text) {

    const lines = text
        .trim()
        .split(/\r?\n/)
        .filter(line => line.trim() !== '');

    if (lines.length < 2) {
        return [];
    }

    const headers = lines[0]
        .split(',')
        .map(header => header.trim());

    return lines.slice(1).map(line => {

        const values = line.split(',');

        const row = {};

        headers.forEach((header, index) => {

            row[header] =
                values[index]
                    ? values[index].trim()
                    : '';

        });

        return row;
    });
}


// ==========================================================
// NORMALIZE COURSE CODE
// ==========================================================

function normalizeCode(code) {

    if (!code) {
        return '';
    }

    return code
        .replace(/\s+/g, '')
        .toUpperCase();
}


// ==========================================================
// GET OR CREATE DEPARTMENT
// ==========================================================

async function getOrCreateDepartment(name) {

    if (!name) {
        throw new Error('Department name is missing');
    }

    const cleanName =
        name.trim().toUpperCase();


    // Check if department already exists

    const existing =
        await db.query(
            `SELECT id
             FROM departments
             WHERE name = $1
             LIMIT 1`,
            [cleanName]
        );


    if (existing.rows.length > 0) {

        return existing.rows[0].id;
    }


    // Create department

    const inserted =
        await db.query(
            `INSERT INTO departments
                (name)
             VALUES
                ($1)
             RETURNING id`,
            [cleanName]
        );


    return inserted.rows[0].id;
}


// ==========================================================
// MAIN IMPORT
// ==========================================================

async function run() {

    try {

        // --------------------------------------------------
        // Check CSV exists
        // --------------------------------------------------

        if (!fs.existsSync(CSV_PATH)) {

            throw new Error(
                `CSV file not found: ${CSV_PATH}`
            );
        }


        // --------------------------------------------------
        // Read CSV
        // --------------------------------------------------

        const csvText =
            fs.readFileSync(
                CSV_PATH,
                'utf8'
            );


        const rows =
            parseCsv(csvText);


        console.log('');
        console.log('==========================================');
        console.log('EXAM SCHEDULE IMPORT');
        console.log('==========================================');

        console.log(
            `CSV rows found: ${rows.length}`
        );


        if (rows.length === 0) {

            console.log(
                'No rows found in CSV.'
            );

            return;
        }


        // --------------------------------------------------
        // Counters
        // --------------------------------------------------

        const deptCache = {};

        let inserted = 0;

        let skipped = 0;

        let errors = 0;


        // --------------------------------------------------
        // Process CSV
        // --------------------------------------------------

        for (const row of rows) {

            try {

                // ------------------------------------------
                // Read CSV fields
                // ------------------------------------------

                const paperCode =
                    normalizeCode(
                        row.paper_code
                    );


                const deptName =
                    row.department
                        ? row.department.trim().toUpperCase()
                        : '';


                const examDate =
                    row.exam_date
                        ? row.exam_date.trim()
                        : '';


                const startTime =
                    row.start_time
                        ? row.start_time.trim()
                        : '';


                const endTime =
                    row.end_time
                        ? row.end_time.trim()
                        : null;


                const paperTitle = row.paper_title ? row.paper_title.trim() : null;
                const program = row.program ? row.program.trim() : null;
                const semester = row.semester ? parseInt(row.semester, 10) || null : null;

                // ------------------------------------------
                // Validate row
                // ------------------------------------------

                if (
                    !paperCode ||
                    !deptName ||
                    !examDate ||
                    !startTime
                ) {

                    console.log(
                        'Skipped invalid CSV row:',
                        row
                    );

                    errors++;

                    continue;
                }


                // ------------------------------------------
                // Get department
                // ------------------------------------------

                if (!deptCache[deptName]) {

                    deptCache[deptName] =
                        await getOrCreateDepartment(
                            deptName
                        );
                }


                const departmentId =
                    deptCache[deptName];


                // ------------------------------------------
                // Check duplicate
                // ------------------------------------------

                const existing =
                    await db.query(
                        `SELECT id
                         FROM exam_schedule
                         WHERE
                            course_code = $1
                            AND department_id = $2
                            AND exam_date = $3
                            AND start_time = $4
                            AND (
                                end_time = $5
                                OR (
                                    end_time IS NULL
                                    AND $5 IS NULL
                                )
                            )
                         LIMIT 1`,
                        [
                            paperCode,
                            departmentId,
                            examDate,
                            startTime,
                            endTime
                        ]
                    );


                // ------------------------------------------
                // Already exists
                // ------------------------------------------

                if (existing.rows.length > 0) {

                    // Backfill descriptive fields on older imports
                    // (never touches room_id).
                    await db.query(
                        `UPDATE exam_schedule
                         SET paper_title = COALESCE(paper_title, $2),
                             program = COALESCE(program, $3),
                             semester = COALESCE(semester, $4)
                         WHERE id = $1`,
                        [existing.rows[0].id, paperTitle, program, semester]
                    );

                    skipped++;

                    continue;
                }


                // ------------------------------------------
                // Insert new examination
                //
                // room_id is intentionally NOT included.
                //
                // Existing room assignments remain untouched.
                // ------------------------------------------

                await db.query(
                    `INSERT INTO exam_schedule
                        (
                            course_code,
                            department_id,
                            exam_date,
                            start_time,
                            end_time,
                            paper_title,
                            program,
                            semester,
                            room_id
                        )
                     VALUES
                        ($1, $2, $3, $4, $5, $6, $7, $8, NULL)`,
                    [
                        paperCode,
                        departmentId,
                        examDate,
                        startTime,
                        endTime,
                        paperTitle,
                        program,
                        semester
                    ]
                );


                inserted++;


                console.log(
                    `Inserted: ${paperCode} | ` +
                    `${examDate} | ` +
                    `${startTime}`
                );

            }
            catch (err) {

                errors++;

                console.error(
                    `Error processing row: ${err.message}`
                );
            }
        }


        // --------------------------------------------------
        // Final result
        // --------------------------------------------------

        console.log('');
        console.log('==========================================');
        console.log('IMPORT COMPLETE');
        console.log('==========================================');

        console.log(
            `CSV rows:        ${rows.length}`
        );

        console.log(
            `New inserted:    ${inserted}`
        );

        console.log(
            `Already existed: ${skipped}`
        );

        console.log(
            `Errors:          ${errors}`
        );

        console.log('==========================================');

        console.log('');
        console.log(
            'Existing room assignments were not changed.'
        );

        console.log(
            '==========================================');


    }
    catch (err) {

        console.error('');
        console.error(
            'IMPORT FAILED:'
        );

        console.error(
            err.message
        );

        process.exitCode = 1;

    }
    finally {

        // Close database connection only if pool exists

        if (db.pool) {
            await db.pool.end();
        }
    }
}


// ==========================================================
// START
// ==========================================================

run();