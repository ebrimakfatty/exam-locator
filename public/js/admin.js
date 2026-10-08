/* ==================================================
   ADMIN FRONTEND JAVASCRIPT
   File: public/js/admin.js
================================================== */


/* ==================================================
   GET HTML ELEMENTS
================================================== */

const form =
    document.getElementById('login-form');

const message =
    document.getElementById('message');

const loginSection =
    document.getElementById('login-section');

const dashboard =
    document.getElementById('dashboard');

const viewScheduleButton =
    document.getElementById('view-schedule-button');

const scheduleSection =
    document.getElementById('schedule-section');

const scheduleTableBody =
    document.getElementById('schedule-table-body');

const scheduleMessage =
    document.getElementById('schedule-message');

const backButton =
    document.getElementById('back-button');

const logoutButton =
    document.getElementById('logout-button');

const manageRoomsButton =
    document.getElementById('manage-rooms-button');

const roomsSection =
    document.getElementById('rooms-section');

const roomsTableBody =
    document.getElementById('rooms-table-body');

const roomsMessage =
    document.getElementById('rooms-message');

const roomsBackButton =
    document.getElementById('rooms-back-button');

const updateButton =
    document.getElementById('update-exams-button');

const updateSection =
    document.getElementById('update-section');

const updateBackButton =
    document.getElementById('update-back-button');

const updateMessage =
    document.getElementById('update-message');

const examSelect =
    document.getElementById('exam-select');

const updateForm =
    document.getElementById('update-form');

const selectedExamDetails =
    document.getElementById('selected-exam-details');

const detailCourse =
    document.getElementById('detail-course');

const detailRoom =
    document.getElementById('detail-room');

const detailBuilding =
    document.getElementById('detail-building');

const updateDate =
    document.getElementById('update-date');

const updateStartTime =
    document.getElementById('update-start-time');

const updateEndTime =
    document.getElementById('update-end-time');

const updateSectionLabel =
    document.getElementById('update-section-label');

const saveUpdateButton =
    document.getElementById('save-update-button');

const cancelUpdateButton =
    document.getElementById('cancel-update-button');


/* ==================================================
   STATISTIC ELEMENTS
================================================== */

const totalExamsElement =
    document.getElementById('total-exams');

const totalRoomsElement =
    document.getElementById('total-rooms');

const assignedRoomsElement =
    document.getElementById('assigned-rooms');

const pendingRoomsElement =
    document.getElementById('pending-rooms');


/* ==================================================
   STORE DATA
================================================== */

let availableRooms = [];

let allExams = [];

let selectedExam = null;


/* ==================================================
   ADMIN LOGIN
================================================== */

form.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault();

        const username =
            document
                .getElementById('username')
                .value
                .trim();

        const password =
            document
                .getElementById('password')
                .value;

        message.textContent =
            'Logging in...';

        try {

            const response =
                await fetch(
                    '/api/admin/login',
                    {
                        method: 'POST',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                username:
                                    username,

                                password:
                                    password
                            })
                    }
                );

            const data =
                await response.json();

            if (!response.ok) {

                message.textContent =
                    data.error ||
                    'Invalid credentials';

                return;
            }

            message.textContent =
                'Login successful!';

            loginSection.style.display =
                'none';

            dashboard.style.display =
                'block';

            /*
             * Load dashboard statistics
             * immediately after login.
             */

            await loadDashboardStatistics();

        }
        catch (error) {

            console.error(
                'Login error:',
                error
            );

            message.textContent =
                'Could not connect to the server.';
        }

    }
);


/* ==================================================
   LOAD EXAMINATIONS
================================================== */

async function loadExaminations() {

    const response =
        await fetch(
            '/api/admin/exam-schedule'
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            'Could not load examinations'
        );
    }

    if (
        !data.schedules ||
        !Array.isArray(data.schedules)
    ) {

        throw new Error(
            'Invalid examination data received'
        );
    }

    allExams =
        data.schedules;

    return allExams;
}


/* ==================================================
   LOAD AVAILABLE ROOMS
================================================== */

async function loadAvailableRooms() {

    const response =
        await fetch(
            '/api/admin/rooms'
        );

    const data =
        await response.json();

    if (!response.ok) {

        throw new Error(
            data.error ||
            'Could not load rooms'
        );
    }

    if (
        !data.rooms ||
        !Array.isArray(data.rooms)
    ) {

        throw new Error(
            'Invalid room data received'
        );
    }

    availableRooms =
        data.rooms;

    return availableRooms;
}


/* ==================================================
   LOAD DASHBOARD STATISTICS
================================================== */

async function loadDashboardStatistics() {

    try {

        /*
         * Load exams and rooms at the
         * same time.
         */

        await Promise.all([
            loadExaminations(),
            loadAvailableRooms()
        ]);


        /* --------------------------------
           TOTAL EXAMS
        -------------------------------- */

        const totalExams =
            allExams.length;


        /* --------------------------------
           TOTAL ROOMS
        -------------------------------- */

        const totalRooms =
            availableRooms.length;


        /* --------------------------------
           ASSIGNED ROOMS
        -------------------------------- */

        const assignedRooms =
            allExams.filter(
                exam =>
                    exam.room_id !== null &&
                    exam.room_id !== undefined
            ).length;


        /* --------------------------------
           PENDING ROOMS
        -------------------------------- */

        const pendingRooms =
            totalExams -
            assignedRooms;


        /* --------------------------------
           DISPLAY VALUES
        -------------------------------- */

        totalExamsElement.textContent =
            totalExams;

        totalRoomsElement.textContent =
            totalRooms;

        assignedRoomsElement.textContent =
            assignedRooms;

        pendingRoomsElement.textContent =
            pendingRooms;

    }
    catch (error) {

        console.error(
            'Dashboard statistics error:',
            error
        );

        totalExamsElement.textContent =
            '-';

        totalRoomsElement.textContent =
            '-';

        assignedRoomsElement.textContent =
            '-';

        pendingRoomsElement.textContent =
            '-';

    }

}


/* ==================================================
   NORMALIZE DATE
================================================== */

function getExamDate(examDate) {

    if (!examDate) {
        return '';
    }

    return String(examDate)
        .substring(0, 10);
}


/* ==================================================
   FORMAT TIME
================================================== */

function formatTime(time) {

    if (!time) {
        return '-';
    }

    return String(time).substring(0, 5);
}


/* ==================================================
   CHECK TIME OVERLAP
================================================== */

function timesOverlap(
    startA,
    endA,
    startB,
    endB
) {

    if (
        !startA ||
        !endA ||
        !startB ||
        !endB
    ) {

        return false;
    }

    return (
        startA < endB &&
        endA > startB
    );
}


/* ==================================================
   CHECK ROOM OCCUPIED
================================================== */

function isRoomOccupied(
    roomId,
    exam
) {

    return allExams.some(
        otherExam => {

            if (
                Number(otherExam.id) ===
                Number(exam.id)
            ) {

                return false;
            }

            if (!otherExam.room_id) {
                return false;
            }

            if (
                Number(otherExam.room_id) !==
                Number(roomId)
            ) {

                return false;
            }

            if (
                getExamDate(
                    otherExam.exam_date
                ) !==
                getExamDate(
                    exam.exam_date
                )
            ) {

                return false;
            }

            return timesOverlap(
                exam.start_time,
                exam.end_time,
                otherExam.start_time,
                otherExam.end_time
            );

        }
    );
}


/* ==================================================
   CREATE ROOM DROPDOWN
================================================== */

function createRoomDropdown(exam) {

    const select =
        document.createElement('select');

    select.className =
        'room-select';

    select.dataset.examId =
        exam.id;

    const defaultOption =
        document.createElement('option');

    defaultOption.value =
        '';

    defaultOption.textContent =
        'Select Room';

    select.appendChild(
        defaultOption
    );

    let availableCount = 0;

    availableRooms.forEach(
        room => {

            const isCurrentRoom =
                exam.room_id &&
                Number(room.id) ===
                Number(exam.room_id);

            const occupied =
                isRoomOccupied(
                    room.id,
                    exam
                );

            if (
                occupied &&
                !isCurrentRoom
            ) {

                return;
            }

            const option =
                document.createElement('option');

            option.value =
                room.id;

            option.textContent =
                `${room.room_no} - ${room.building_name} (${room.floor})`;

            if (isCurrentRoom) {

                option.selected =
                    true;
            }

            select.appendChild(
                option
            );

            availableCount++;

        }
    );

    if (
        availableCount === 0
    ) {

        defaultOption.textContent =
            'No rooms available';

        defaultOption.disabled =
            true;
    }

    return select;
}


/* ==================================================
   VIEW EXAM SCHEDULE
================================================== */

viewScheduleButton.addEventListener(
    'click',
    async () => {

        scheduleSection.style.display =
            'block';

        roomsSection.style.display =
            'none';

        updateSection.style.display =
            'none';

        scheduleMessage.textContent =
            'Loading examination schedule...';

        scheduleTableBody.innerHTML =
            '';

        try {

            const exams =
                await loadExaminations();

            scheduleMessage.textContent =
                `Total examinations: ${exams.length}`;

            if (
                exams.length === 0
            ) {

                scheduleMessage.innerHTML =
                    `<div class="error-message">
                        No examination schedules found.
                    </div>`;

                return;
            }

            scheduleTableBody.innerHTML =
                exams.map(
                    schedule => {

                        return `
                            <tr>

                                <td>
                                    ${schedule.course_code || '-'}
                                </td>

                                <td>
                                    ${
                                        schedule.exam_date
                                            ? new Date(
                                                schedule.exam_date
                                            ).toLocaleDateString()
                                            : '-'
                                    }
                                </td>

                                <td>
                                    ${formatTime(schedule.start_time)}
                                </td>

                                <td>
                                    ${formatTime(schedule.end_time)}
                                </td>

                                <td>
                                    ${schedule.section_label || '-'}
                                </td>

                                <td>
                                    ${
                                        schedule.room_no
                                            ? `<span class="room-assigned">
                                                ${schedule.room_no}
                                              </span>`
                                            : `<span class="room-pending">
                                                Not assigned
                                              </span>`
                                    }
                                </td>

                                <td>
                                    ${schedule.floor || '-'}
                                </td>

                                <td>
                                    ${schedule.building_name || '-'}
                                </td>

                            </tr>
                        `;

                    }
                ).join('');

            /*
             * Refresh statistics in case
             * something changed.
             */

            await loadDashboardStatistics();

        }
        catch (error) {

            console.error(
                'Schedule loading error:',
                error
            );

            scheduleMessage.innerHTML =
                `<div class="error-message">
                    Could not load examination schedule.
                    <br>
                    Error: ${error.message}
                </div>`;
        }

    }
);


/* ==================================================
   BACK FROM SCHEDULE
================================================== */

backButton.addEventListener(
    'click',
    () => {

        scheduleSection.style.display =
            'none';

        scheduleMessage.textContent =
            '';

        scheduleTableBody.innerHTML =
            '';

    }
);


/* ==================================================
   ASSIGN ROOM
================================================== */

async function assignRoom(
    examId,
    roomId,
    button
) {

    if (!roomId) {

        alert(
            'Please select a room first.'
        );

        return;
    }

    const originalText =
        button.textContent;

    button.disabled =
        true;

    button.textContent =
        'Assigning...';

    try {

        const response =
            await fetch(
                `/api/admin/exam-schedule/${examId}/room`,
                {
                    method: 'PUT',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            room_id:
                                Number(roomId)
                        })
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                'Could not assign room'
            );
        }

        roomsMessage.innerHTML =
            `<div class="success-message">
                Room assigned successfully.
            </div>`;

        await loadRoomAssignments();

        /*
         * Refresh dashboard statistics.
         */

        await loadDashboardStatistics();

    }
    catch (error) {

        console.error(
            'Room assignment error:',
            error
        );

        roomsMessage.innerHTML =
            `<div class="error-message">
                Could not assign room.
                <br>
                Error: ${error.message}
            </div>`;

        button.disabled =
            false;

        button.textContent =
            originalText;
    }

}


/* ==================================================
   LOAD ROOM ASSIGNMENTS
================================================== */

async function loadRoomAssignments() {

    roomsMessage.textContent =
        'Loading examinations and rooms...';

    roomsTableBody.innerHTML =
        '';

    try {

        await Promise.all([
            loadAvailableRooms(),
            loadExaminations()
        ]);

        roomsMessage.textContent =
            `Total examinations: ${allExams.length} | Available rooms: ${availableRooms.length}`;

        if (
            allExams.length === 0
        ) {

            roomsMessage.innerHTML =
                `<div class="error-message">
                    No examination schedules found.
                </div>`;

            return;
        }

        allExams.forEach(
            exam => {

                const row =
                    document.createElement('tr');


                /* COURSE */

                const courseCell =
                    document.createElement('td');

                courseCell.textContent =
                    exam.course_code || '-';

                row.appendChild(
                    courseCell
                );


                /* DATE */

                const dateCell =
                    document.createElement('td');

                dateCell.textContent =
                    exam.exam_date
                        ? new Date(
                            exam.exam_date
                        ).toLocaleDateString()
                        : '-';

                row.appendChild(
                    dateCell
                );


                /* START */

                const startCell =
                    document.createElement('td');

                startCell.textContent =
                    formatTime(
                        exam.start_time
                    );

                row.appendChild(
                    startCell
                );


                /* END */

                const endCell =
                    document.createElement('td');

                endCell.textContent =
                    formatTime(
                        exam.end_time
                    );

                row.appendChild(
                    endCell
                );


                /* CURRENT ROOM */

                const currentRoomCell =
                    document.createElement('td');

                if (exam.room_no) {

                    currentRoomCell.innerHTML =
                        `<span class="room-assigned">
                            ${exam.room_no}
                        </span>`;

                }
                else {

                    currentRoomCell.innerHTML =
                        `<span class="room-pending">
                            Not assigned
                        </span>`;
                }

                row.appendChild(
                    currentRoomCell
                );


                /* BUILDING */

                const buildingCell =
                    document.createElement('td');

                buildingCell.textContent =
                    exam.building_name || '-';

                row.appendChild(
                    buildingCell
                );


                /* FLOOR */

                const floorCell =
                    document.createElement('td');

                floorCell.textContent =
                    exam.floor || '-';

                row.appendChild(
                    floorCell
                );


                /* ASSIGN ROOM */

                const assignCell =
                    document.createElement('td');

                const select =
                    createRoomDropdown(
                        exam
                    );

                const assignButton =
                    document.createElement('button');

                assignButton.className =
                    'assign-button';

                assignButton.textContent =
                    exam.room_id
                        ? 'Change Room'
                        : 'Assign Room';

                assignButton.addEventListener(
                    'click',
                    () => {

                        assignRoom(
                            exam.id,
                            select.value,
                            assignButton
                        );

                    }
                );

                assignCell.appendChild(
                    select
                );

                assignCell.appendChild(
                    assignButton
                );

                row.appendChild(
                    assignCell
                );

                roomsTableBody.appendChild(
                    row
                );

            }
        );

    }
    catch (error) {

        console.error(
            'Room assignment loading error:',
            error
        );

        roomsMessage.innerHTML =
            `<div class="error-message">
                Could not load room assignment data.
                <br>
                Error: ${error.message}
            </div>`;
    }

}


/* ==================================================
   VIEW ROOMS
================================================== */

manageRoomsButton.addEventListener(
    'click',
    async () => {

        scheduleSection.style.display =
            'none';

        updateSection.style.display =
            'none';

        roomsSection.style.display =
            'block';

        await loadRoomAssignments();

    }
);


/* ==================================================
   BACK FROM ROOMS
================================================== */

roomsBackButton.addEventListener(
    'click',
    () => {

        roomsSection.style.display =
            'none';

        roomsMessage.textContent =
            '';

        roomsTableBody.innerHTML =
            '';

    }
);


/* ==================================================
   UPDATE EXAMS
================================================== */

updateButton.addEventListener(
    'click',
    async () => {

        scheduleSection.style.display =
            'none';

        roomsSection.style.display =
            'none';

        updateSection.style.display =
            'block';

        updateMessage.textContent =
            'Loading examinations...';

        updateForm.style.display =
            'none';

        selectedExamDetails.style.display =
            'none';

        examSelect.innerHTML =
            `<option value="">
                Select an examination
            </option>`;

        try {

            const exams =
                await loadExaminations();

            updateMessage.textContent =
                `Total examinations: ${exams.length}`;

            exams.forEach(
                exam => {

                    const option =
                        document.createElement('option');

                    option.value =
                        exam.id;

                    option.textContent =
                        `${exam.course_code} - ${getExamDate(exam.exam_date)} ${formatTime(exam.start_time)}`;

                    examSelect.appendChild(
                        option
                    );

                }
            );

        }
        catch (error) {

            console.error(
                'Update exam loading error:',
                error
            );

            updateMessage.innerHTML =
                `<div class="error-message">
                    Could not load examinations.
                    <br>
                    Error: ${error.message}
                </div>`;
        }

    }
);


/* ==================================================
   SELECT EXAMINATION
================================================== */

examSelect.addEventListener(
    'change',
    () => {

        const examId =
            examSelect.value;

        if (!examId) {

            selectedExam =
                null;

            selectedExamDetails.style.display =
                'none';

            updateForm.style.display =
                'none';

            return;
        }

        selectedExam =
            allExams.find(
                exam =>
                    Number(exam.id) ===
                    Number(examId)
            );

        if (!selectedExam) {

            return;
        }


        selectedExamDetails.style.display =
            'block';

        updateForm.style.display =
            'block';


        detailCourse.textContent =
            selectedExam.course_code || '-';

        detailRoom.textContent =
            selectedExam.room_no || 'Not assigned';

        detailBuilding.textContent =
            selectedExam.building_name || '-';


        updateDate.value =
            getExamDate(
                selectedExam.exam_date
            );

        updateStartTime.value =
            formatTime(
                selectedExam.start_time
            ) === '-'
                ? ''
                : formatTime(
                    selectedExam.start_time
                );

        updateEndTime.value =
            formatTime(
                selectedExam.end_time
            ) === '-'
                ? ''
                : formatTime(
                    selectedExam.end_time
                );

        updateSectionLabel.value =
            selectedExam.section_label || '';

        updateMessage.textContent =
            '';

    }
);


/* ==================================================
   SAVE EXAM UPDATE
================================================== */

updateForm.addEventListener(
    'submit',
    async (e) => {

        e.preventDefault();

        if (!selectedExam) {

            updateMessage.innerHTML =
                `<div class="error-message">
                    Please select an examination.
                </div>`;

            return;
        }


        const examDate =
            updateDate.value;

        const startTime =
            updateStartTime.value;

        const endTime =
            updateEndTime.value;

        const sectionLabel =
            updateSectionLabel.value.trim();


        if (
            !examDate ||
            !startTime
        ) {

            updateMessage.innerHTML =
                `<div class="error-message">
                    Examination date and start time are required.
                </div>`;

            return;
        }


        if (
            endTime &&
            startTime >= endTime
        ) {

            updateMessage.innerHTML =
                `<div class="error-message">
                    End time must be later than start time.
                </div>`;

            return;
        }


        saveUpdateButton.disabled =
            true;

        saveUpdateButton.textContent =
            'Saving...';

        updateMessage.textContent =
            'Updating examination...';


        try {

            const response =
                await fetch(
                    `/api/admin/exam-schedule/${selectedExam.id}`,
                    {
                        method: 'PUT',

                        headers: {
                            'Content-Type':
                                'application/json'
                        },

                        body:
                            JSON.stringify({
                                exam_date:
                                    examDate,

                                start_time:
                                    startTime,

                                end_time:
                                    endTime ||
                                    null,

                                section_label:
                                    sectionLabel ||
                                    null
                            })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.error ||
                    'Could not update examination'
                );
            }


            updateMessage.innerHTML =
                `<div class="success-message">
                    Examination updated successfully.
                </div>`;


            await loadExaminations();


            /*
             * Refresh statistics after
             * examination update.
             */

            await loadDashboardStatistics();


            const updatedExamId =
                selectedExam.id;


            selectedExam =
                allExams.find(
                    exam =>
                        Number(exam.id) ===
                        Number(updatedExamId)
                );


            if (selectedExam) {

                updateDate.value =
                    getExamDate(
                        selectedExam.exam_date
                    );

                updateStartTime.value =
                    formatTime(
                        selectedExam.start_time
                    );

                updateEndTime.value =
                    formatTime(
                        selectedExam.end_time
                    ) === '-'
                        ? ''
                        : formatTime(
                            selectedExam.end_time
                        );

                updateSectionLabel.value =
                    selectedExam.section_label || '';

                detailCourse.textContent =
                    selectedExam.course_code || '-';

                detailRoom.textContent =
                    selectedExam.room_no || 'Not assigned';

                detailBuilding.textContent =
                    selectedExam.building_name || '-';
            }


        }
        catch (error) {

            console.error(
                'Exam update error:',
                error
            );

            updateMessage.innerHTML =
                `<div class="error-message">
                    Could not update examination.
                    <br>
                    Error: ${error.message}
                </div>`;

        }
        finally {

            saveUpdateButton.disabled =
                false;

            saveUpdateButton.textContent =
                'Save Changes';

        }

    }
);


/* ==================================================
   CANCEL UPDATE
================================================== */

cancelUpdateButton.addEventListener(
    'click',
    () => {

        if (!selectedExam) {
            return;
        }

        updateDate.value =
            getExamDate(
                selectedExam.exam_date
            );

        updateStartTime.value =
            formatTime(
                selectedExam.start_time
            );

        updateEndTime.value =
            formatTime(
                selectedExam.end_time
            ) === '-'
                ? ''
                : formatTime(
                    selectedExam.end_time
                );

        updateSectionLabel.value =
            selectedExam.section_label || '';

        updateMessage.textContent =
            'Changes cancelled.';

    }
);


/* ==================================================
   BACK FROM UPDATE
================================================== */

updateBackButton.addEventListener(
    'click',
    () => {

        updateSection.style.display =
            'none';

        updateMessage.textContent =
            '';

        updateForm.style.display =
            'none';

        selectedExamDetails.style.display =
            'none';

        examSelect.innerHTML =
            `<option value="">
                Select an examination
            </option>`;

        selectedExam =
            null;

    }
);


/* ==================================================
   LOGOUT
================================================== */

logoutButton.addEventListener(
    'click',
    async () => {

        try {

            const response =
                await fetch(
                    '/api/admin/logout',
                    {
                        method: 'POST'
                    }
                );

            if (!response.ok) {

                console.error(
                    'Logout failed'
                );
            }

            dashboard.style.display =
                'none';

            loginSection.style.display =
                'block';

            scheduleSection.style.display =
                'none';

            roomsSection.style.display =
                'none';

            updateSection.style.display =
                'none';

            scheduleTableBody.innerHTML =
                '';

            scheduleMessage.textContent =
                '';

            roomsTableBody.innerHTML =
                '';

            roomsMessage.textContent =
                '';

            updateMessage.textContent =
                '';

            availableRooms =
                [];

            allExams =
                [];

            selectedExam =
                null;


            /*
             * Reset statistic cards.
             */

            totalExamsElement.textContent =
                '0';

            totalRoomsElement.textContent =
                '0';

            assignedRoomsElement.textContent =
                '0';

            pendingRoomsElement.textContent =
                '0';


            form.reset();

            message.textContent =
                '';

        }
        catch (error) {

            console.error(
                'Logout error:',
                error
            );

        }

    }
);