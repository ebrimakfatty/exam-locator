
const express = require('express');
const bcrypt = require('bcrypt');

const router = express.Router();

const db = require('../db');


// ======================================================
// ADMIN LOGIN
// POST /api/admin/login
// ======================================================

router.post('/login', async (req, res) => {

    const {
        username,
        password
    } = req.body;

    if (!username || !password) {

        return res.status(400).json({
            error:
                'Username and password are required.'
        });

    }

    try {

        const result = await db.query(
            `
            SELECT
                id,
                username,
                password_hash
            FROM admins
            WHERE username = $1
            `,
            [username]
        );

        if (result.rows.length === 0) {

            return res.status(401).json({
                error:
                    'Invalid username or password.'
            });

        }

        const admin =
            result.rows[0];

        const passwordCorrect =
            await bcrypt.compare(
                password,
                admin.password_hash
            );

        if (!passwordCorrect) {

            return res.status(401).json({
                error:
                    'Invalid username or password.'
            });

        }

        req.session.adminId =
            admin.id;

        req.session.adminUsername =
            admin.username;

        res.json({
            message:
                'Login successful.'
        });

    }
    catch (err) {

        console.error(
            'Admin login error:',
            err
        );

        res.status(500).json({
            error:
                'Login failed.'
        });

    }

});


// ======================================================
// AUTHENTICATION MIDDLEWARE
// ======================================================

function requireAdmin(
    req,
    res,
    next
) {

    if (!req.session.adminId) {

        return res.status(401).json({
            error:
                'Admin login required.'
        });

    }

    next();

}


// ======================================================
// ADMIN LOGOUT
// POST /api/admin/logout
// ======================================================

router.post(
    '/logout',
    requireAdmin,
    (req, res) => {

        req.session.destroy(
            (err) => {

                if (err) {

                    console.error(
                        'Logout error:',
                        err
                    );

                    return res.status(500).json({
                        error:
                            'Could not logout.'
                    });

                }

                res.json({
                    message:
                        'Logout successful.'
                });

            }
        );

    }
);


// ======================================================
// GET EXAM SCHEDULE
// GET /api/admin/exam-schedule
// ======================================================

router.get(
    '/exam-schedule',
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT

                        es.id,
                        es.course_code,
                        es.paper_title,
                        es.program,

                        es.exam_date,
                        es.start_time,
                        es.end_time,

                        es.section_label,
                        es.last_updated,

                        es.room_id,

                        r.room_no,
                        r.floor,
                        r.capacity,

                        b.id AS building_id,
                        b.name AS building_name,
                        b.map_zone

                    FROM exam_schedule es

                    LEFT JOIN rooms r
                        ON es.room_id = r.id

                    LEFT JOIN buildings b
                        ON r.building_id = b.id

                    ORDER BY
                        es.exam_date,
                        es.start_time,
                        es.course_code
                    `
                );

            res.json({
                schedules:
                    result.rows
            });

        }
        catch (err) {

            console.error(
                'Exam schedule error:',
                err
            );

            res.status(500).json({
                error:
                    'Could not load examination schedule.'
            });

        }

    }
);


// ======================================================
// GET ALL ROOMS
// GET /api/admin/rooms
// ======================================================

router.get(
    '/rooms',
    requireAdmin,
    async (req, res) => {

        try {

            const result =
                await db.query(
                    `
                    SELECT

                        r.id,
                        r.room_no,
                        r.floor,
                        r.capacity,

                        b.id AS building_id,
                        b.name AS building_name,
                        b.map_zone

                    FROM rooms r

                    INNER JOIN buildings b
                        ON r.building_id = b.id

                    ORDER BY
                        b.name,
                        r.floor,
                        r.room_no
                    `
                );

            res.json({
                rooms:
                    result.rows
            });

        }
        catch (err) {

            console.error(
                'Rooms error:',
                err
            );

            res.status(500).json({
                error:
                    'Could not load rooms.'
            });

        }

    }
);


// ======================================================
// ASSIGN ROOM
// PUT /api/admin/exam-schedule/:id/room
// ======================================================

router.put(
    '/exam-schedule/:id/room',
    requireAdmin,
    async (req, res) => {

        const examId =
            Number(req.params.id);

        const roomId =
            Number(req.body.room_id);

        if (!Number.isInteger(examId)) {

            return res.status(400).json({
                error:
                    'Invalid examination ID.'
            });

        }

        if (!Number.isInteger(roomId)) {

            return res.status(400).json({
                error:
                    'Valid room_id is required.'
            });

        }

        try {

            // --------------------------------
            // GET EXAM
            // --------------------------------

            const examResult =
                await db.query(
                    `
                    SELECT
                        id,
                        exam_date,
                        start_time,
                        end_time
                    FROM exam_schedule
                    WHERE id = $1
                    `,
                    [examId]
                );

            if (
                examResult.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Examination not found.'
                });

            }

            const exam =
                examResult.rows[0];


            // --------------------------------
            // CHECK ROOM EXISTS
            // --------------------------------

            const roomResult =
                await db.query(
                    `
                    SELECT
                        id,
                        room_no,
                        floor
                    FROM rooms
                    WHERE id = $1
                    `,
                    [roomId]
                );

            if (
                roomResult.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Room not found.'
                });

            }


            // --------------------------------
            // CHECK FOR CONFLICT
            // --------------------------------

            const conflict =
                await db.query(
                    `
                    SELECT
                        id,
                        course_code,
                        start_time,
                        end_time
                    FROM exam_schedule

                    WHERE room_id = $1

                    AND exam_date = $2

                    AND id <> $3

                    AND (
                        start_time <
                        COALESCE(
                            $5,
                            '23:59:59'::time
                        )

                        AND

                        COALESCE(
                            end_time,
                            '23:59:59'::time
                        ) > $4
                    )

                    LIMIT 1
                    `,
                    [
                        roomId,
                        exam.exam_date,
                        examId,
                        exam.start_time,
                        exam.end_time
                    ]
                );

            if (
                conflict.rows.length > 0
            ) {

                const conflictingExam =
                    conflict.rows[0];

                return res.status(409).json({
                    error:
                        `Room is already occupied by ${conflictingExam.course_code} during this time.`
                });

            }


            // --------------------------------
            // ASSIGN ROOM
            // --------------------------------

            const updated =
                await db.query(
                    `
                    UPDATE exam_schedule

                    SET
                        room_id = $1,
                        last_updated = NOW()

                    WHERE id = $2

                    RETURNING
                        id,
                        course_code,
                        room_id,
                        last_updated
                    `,
                    [
                        roomId,
                        examId
                    ]
                );

            res.json({
                message:
                    'Room assigned successfully.',

                exam:
                    updated.rows[0]
            });

        }
        catch (err) {

            console.error(
                'Room assignment error:',
                err
            );

            res.status(500).json({
                error:
                    'Could not assign room.'
            });

        }

    }
);


// ======================================================
// UPDATE EXAMINATION
// PUT /api/admin/exam-schedule/:id
// ======================================================

router.put(
    '/exam-schedule/:id',
    requireAdmin,
    async (req, res) => {

        const examId =
            Number(req.params.id);

        const {
            exam_date,
            start_time,
            end_time,
            section_label
        } = req.body;

        if (!Number.isInteger(examId)) {

            return res.status(400).json({
                error:
                    'Invalid examination ID.'
            });

        }

        if (
            !exam_date ||
            !start_time
        ) {

            return res.status(400).json({
                error:
                    'Exam date and start time are required.'
            });

        }

        if (
            end_time &&
            start_time >= end_time
        ) {

            return res.status(400).json({
                error:
                    'End time must be later than start time.'
            });

        }

        try {

            // --------------------------------
            // GET CURRENT EXAM
            // --------------------------------

            const currentResult =
                await db.query(
                    `
                    SELECT
                        id,
                        course_code,
                        room_id
                    FROM exam_schedule
                    WHERE id = $1
                    `,
                    [examId]
                );

            if (
                currentResult.rows.length === 0
            ) {

                return res.status(404).json({
                    error:
                        'Examination not found.'
                });

            }

            const currentExam =
                currentResult.rows[0];


            // --------------------------------
            // CHECK COURSE/DATE/TIME DUPLICATE
            // --------------------------------

            const duplicate =
                await db.query(
                    `
                    SELECT id

                    FROM exam_schedule

                    WHERE course_code = $1

                    AND exam_date = $2

                    AND start_time = $3

                    AND id <> $4

                    LIMIT 1
                    `,
                    [
                        currentExam.course_code,
                        exam_date,
                        start_time,
                        examId
                    ]
                );

            if (
                duplicate.rows.length > 0
            ) {

                return res.status(409).json({
                    error:
                        'Another examination already exists for this course, date and start time.'
                });

            }


            // --------------------------------
            // CHECK ROOM CONFLICT
            // --------------------------------

            if (
                currentExam.room_id
            ) {

                const conflict =
                    await db.query(
                        `
                        SELECT
                            id,
                            course_code
                        FROM exam_schedule

                        WHERE room_id = $1

                        AND exam_date = $2

                        AND id <> $3

                        AND (
                            start_time <
                            COALESCE(
                                $5,
                                '23:59:59'::time
                            )

                            AND

                            COALESCE(
                                end_time,
                                '23:59:59'::time
                            ) > $4
                        )

                        LIMIT 1
                        `,
                        [
                            currentExam.room_id,
                            exam_date,
                            examId,
                            start_time,
                            end_time
                        ]
                    );

                if (
                    conflict.rows.length > 0
                ) {

                    return res.status(409).json({
                        error:
                            `The assigned room conflicts with ${conflict.rows[0].course_code}.`
                    });

                }

            }


            // --------------------------------
            // UPDATE EXAM
            // --------------------------------

            const updated =
                await db.query(
                    `
                    UPDATE exam_schedule

                    SET
                        exam_date = $1,
                        start_time = $2,
                        end_time = $3,
                        section_label = $4,
                        last_updated = NOW()

                    WHERE id = $5

                    RETURNING *
                    `,
                    [
                        exam_date,
                        start_time,
                        end_time || null,
                        section_label || null,
                        examId
                    ]
                );

            res.json({
                message:
                    'Examination updated successfully.',

                exam:
                    updated.rows[0]
            });

        }
        catch (err) {

            console.error(
                'Exam update error:',
                err
            );

            res.status(500).json({
                error:
                    'Could not update examination.'
            });

        }

    }
);


module.exports = router;
