const express = require('express');
const router = express.Router();
const db = require('../db');

// ------------------------------------------------------
// GET /api/search/suggest?q=csd5
// Suggestions for the student search box. Matches course
// codes (ignoring spaces/hyphens/case) and paper titles.
// If nothing matches, falls back to "close" codes so a
// small typing mistake still finds something.
// ------------------------------------------------------

function normalize(text) {
    return String(text || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function editDistance(a, b) {
    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
            // swapping two neighbouring letters (csd -> cds) counts as ONE mistake
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
            }
        }
    }
    return dp[a.length][b.length];
}

router.get('/suggest', async (req, res) => {

    const raw = String(req.query.q || '').trim().slice(0, 60);
    const norm = normalize(raw);

    if (norm.length < 1) {
        return res.json({ suggestions: [], fuzzy: false });
    }

    try {

        // All distinct papers (a few hundred rows at most).
        const all = await db.query(
            `
            SELECT DISTINCT ON (course_code)
                course_code, paper_title, program, semester
            FROM exam_schedule
            ORDER BY course_code
            `
        );

        const rows = all.rows.map(r => ({
            course_code: r.course_code,
            paper_title: r.paper_title,
            program: r.program,
            semester: r.semester,
            codeNorm: normalize(r.course_code),
            titleNorm: String(r.paper_title || '').toUpperCase()
        }));

        const titleQuery = raw.toUpperCase();

        let matches = rows
            .filter(r =>
                r.codeNorm.includes(norm) ||
                (raw.length >= 3 && r.titleNorm.includes(titleQuery))
            )
            .sort((a, b) => {
                const aStarts = a.codeNorm.startsWith(norm) ? 0 : 1;
                const bStarts = b.codeNorm.startsWith(norm) ? 0 : 1;
                return aStarts - bStarts ||
                    a.course_code.localeCompare(b.course_code);
            });

        let fuzzy = false;

        if (matches.length === 0 && norm.length >= 3) {
            matches = rows
                .map(r => ({ r, d: editDistance(norm, r.codeNorm) }))
                .filter(x => x.d <= 2)
                .sort((a, b) => a.d - b.d ||
                    a.r.course_code.localeCompare(b.r.course_code))
                .map(x => x.r);
            fuzzy = matches.length > 0;
        }

        res.json({
            fuzzy,
            suggestions: matches.slice(0, 8).map(r => ({
                course_code: r.course_code,
                paper_title: r.paper_title,
                program: r.program,
                semester: r.semester
            }))
        });

    }
    catch (err) {
        console.error('Suggest error:', err);
        res.status(500).json({ error: 'Could not load suggestions.' });
    }

});


// GET /api/search?course_code=CS201
router.get('/', async (req, res) => {

    const { course_code } = req.query;

    if (!course_code || !course_code.trim()) {
        return res.status(400).json({
            error: 'course_code is required'
        });
    }

    try {

        const result = await db.query(
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

                r.room_no,
                r.floor,

                b.name AS building_name,
                b.map_zone

            FROM exam_schedule es

            LEFT JOIN rooms r
                ON es.room_id = r.id

            LEFT JOIN buildings b
                ON r.building_id = b.id

            WHERE UPPER(TRIM(es.course_code))
                = UPPER(TRIM($1))

            ORDER BY
                es.exam_date,
                es.start_time
            `,
            [course_code]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: 'No exam found for this course code'
            });

        }

        res.json({
            results: result.rows
        });

    }
    catch (err) {

        console.error(
            'Search error:',
            err
        );

        res.status(500).json({
            error:
                'Something went wrong. Please try again.'
        });

    }

});

module.exports = router;