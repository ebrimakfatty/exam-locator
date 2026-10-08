/* ==================================================
   EXAM CLASSROOM LOCATOR
   STUDENT SEARCH JAVASCRIPT

   File:
   public/js/search.js
================================================== */


/* ==================================================
   GET HTML ELEMENTS
================================================== */

const form = document.getElementById('search-form');
const resultArea = document.getElementById('result-area');


/* ==================================================
   SEARCH FORM
================================================== */

form.addEventListener('submit', async (e) => {

    e.preventDefault();


    /* ----------------------------------------------
       GET COURSE CODE
    ---------------------------------------------- */

    const courseCode =
        document
            .getElementById('course-code')
            .value
            .trim()
            .toUpperCase();


    if (!courseCode) {
        return;
    }


    /* ----------------------------------------------
       SEARCH MESSAGE
    ---------------------------------------------- */

    resultArea.innerHTML = `
        <div class="info-message">
            Searching for examination information...
        </div>
    `;


    try {

        /* ==========================================
           CALL SEARCH API
        ========================================== */

        const response = await fetch(
            `/api/search?course_code=${encodeURIComponent(courseCode)}`
        );


        const data = await response.json();


        /* ==========================================
           SERVER ERROR
        ========================================== */

        if (!response.ok) {

            resultArea.innerHTML = `
                <div class="error-message">

                    <strong>
                        Unable to find examination information.
                    </strong>

                    <br><br>

                    ${escapeHTML(
                        data.error ||
                        'Please try again later.'
                    )}

                </div>
            `;

            return;
        }


        /* ==========================================
           NO RESULTS
        ========================================== */

        if (
            !data.results ||
            !Array.isArray(data.results) ||
            data.results.length === 0
        ) {

            resultArea.innerHTML = `
                <div class="error-message">

                    <strong>
                        No examination found.
                    </strong>

                    <br><br>

                    We could not find an examination
                    for course code:

                    <strong>
                        ${escapeHTML(courseCode)}
                    </strong>

                    <br><br>

                    Please check the course code
                    and try again.

                </div>
            `;

            return;
        }


        /* ==========================================
           DISPLAY EXAM RESULTS
        ========================================== */

        resultArea.innerHTML =
            data.results
                .map(exam => createExamCard(exam, courseCode))
                .join('');


    }
    catch (error) {

        console.error(
            'Search error:',
            error
        );


        resultArea.innerHTML = `
            <div class="error-message">

                <strong>
                    Unable to connect to the server.
                </strong>

                <br><br>

                Please make sure the Exam Classroom
                Locator server is running and try again.

            </div>
        `;

    }

});


/* ==================================================
   CREATE EXAM CARD
================================================== */

function createExamCard(exam, searchedCourseCode) {


    /* ==============================================
       COURSE CODE
    ============================================== */

    const courseCode =
        exam.course_code ||
        searchedCourseCode;


    /* ==============================================
       PAPER TITLE
    ============================================== */

    const paperTitle =
        exam.paper_title
            ? `
                <p class="paper-title">
                    ${escapeHTML(exam.paper_title)}
                </p>
              `
            : '';


    /* ==============================================
       PROGRAM
    ============================================== */

    const program =
        exam.program
            ? `
                <p>
                    <strong>Program:</strong>
                    ${escapeHTML(exam.program)}
                </p>
              `
            : '';


    /* ==============================================
       SEMESTER
    ============================================== */

    const semester =
        exam.semester
            ? `
                <p>
                    <strong>Semester:</strong>
                    ${escapeHTML(exam.semester)}
                </p>
              `
            : '';


    /* ==============================================
       DATE
    ============================================== */

    let date = 'Not available';


    if (exam.exam_date) {

        const parsedDate =
            new Date(String(exam.exam_date).substring(0, 10) + 'T00:00:00');


        if (!isNaN(parsedDate.getTime())) {

            date =
                parsedDate.toLocaleDateString(
                    'en-IN',
                    {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                    }
                );

        }

    }


    /* ==============================================
       TIME
    ============================================== */

    const startTime =
        exam.start_time
            ? String(exam.start_time).substring(0, 5)
            : '';


    const endTime =
        exam.end_time
            ? String(exam.end_time).substring(0, 5)
            : '';


    let time = 'Not available';


    if (startTime && endTime) {

        time =
            `${startTime} - ${endTime}`;

    }
    else if (startTime) {

        time =
            startTime;

    }


    /* ==============================================
       SECTION
    ============================================== */

    const section =
        exam.section_label
            ? `
                <p>
                    <strong>Section:</strong>
                    ${escapeHTML(exam.section_label)}
                </p>
              `
            : '';


    /* ==============================================
       LOCATION DATA
    ============================================== */

    const building =
        exam.building_name
            ? String(exam.building_name).trim()
            : '';


    const floor =
        exam.floor !== null &&
        exam.floor !== undefined
            ? String(exam.floor).trim()
            : '';


    const room =
        exam.room_no
            ? String(exam.room_no).trim()
            : '';


    /* ==============================================
       LOCATION SECTION
    ============================================== */

    let locationSection = '';


    /* ----------------------------------------------
       LOCATION AVAILABLE
    ---------------------------------------------- */

    if (building && room) {


        /* ==========================================
           CREATE MAP URL

           These values are sent to map.html:

           building
           floor
           room
           course
        ========================================== */

        const mapUrl =
            `/map.html` +
            `?building=${encodeURIComponent(building)}` +
            `&floor=${encodeURIComponent(floor)}` +
            `&room=${encodeURIComponent(room)}` +
            `&course=${encodeURIComponent(courseCode)}`;


        locationSection = `

            <div class="location-box">

                <p>
                    <strong>Building:</strong>
                    ${escapeHTML(building)}
                </p>

                <p>
                    <strong>Floor:</strong>
                    ${escapeHTML(
                        floor || 'Not specified'
                    )}
                </p>

                <p>
                    <strong>Room:</strong>
                    ${escapeHTML(room)}
                </p>


                <!-- =================================
                     VIEW LOCATION BUTTON
                ================================== -->

                <a
                    href="${mapUrl}"
                    class="view-location-button"
                >

                    📍 View Location

                </a>

            </div>

        `;

    }


    /* ----------------------------------------------
       ROOM NOT ASSIGNED
    ---------------------------------------------- */

    else {

        locationSection = `

            <div class="room-pending">

                <strong>
                    Room not yet assigned.
                </strong>

                <br><br>

                The examination room has not been
                assigned yet.

                <br><br>

                Please check again closer to the
                examination date.

            </div>

        `;

    }


    /* ==============================================
       RETURN COMPLETE CARD
    ============================================== */

    return `

        <div class="result-card">


            <!-- =====================================
                 COURSE
            ====================================== -->

            <h2>
                ${escapeHTML(courseCode)}
            </h2>


            <!-- =====================================
                 PAPER
            ====================================== -->

            ${paperTitle}


            <!-- =====================================
                 PROGRAM
            ====================================== -->

            ${program}


            <!-- =====================================
                 SEMESTER
            ====================================== -->

            ${semester}


            <hr>


            <!-- =====================================
                 EXAM INFORMATION
            ====================================== -->

            <div class="exam-information">

                <p>

                    <strong>
                        Exam Date:
                    </strong>

                    ${escapeHTML(date)}

                </p>


                <p>

                    <strong>
                        Time:
                    </strong>

                    ${escapeHTML(time)}

                </p>


                ${section}

            </div>


            <!-- =====================================
                 LOCATION
            ====================================== -->

            ${locationSection}


        </div>

    `;

}


/* ==================================================
   ESCAPE HTML

   Protects the page from HTML being inserted
   through database values.
================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return '';

    }


    return String(value)

        .replace(
            /&/g,
            '&amp;'
        )

        .replace(
            /</g,
            '&lt;'
        )

        .replace(
            />/g,
            '&gt;'
        )

        .replace(
            /"/g,
            '&quot;'
        )

        .replace(
            /'/g,
            '&#039;'
        );

}