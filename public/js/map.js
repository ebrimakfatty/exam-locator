/* ==================================================
   EXAM CLASSROOM LOCATOR
   MAP JAVASCRIPT
   File: public/js/map.js
================================================== */


/* ==================================================
   GET URL PARAMETERS
================================================== */

const urlParams =
    new URLSearchParams(
        window.location.search
    );


const building =
    urlParams.get('building');


const floor =
    urlParams.get('floor');


const room =
    urlParams.get('room');


const course =
    urlParams.get('course');


/* ==================================================
   GET ELEMENTS
================================================== */

const courseElement =
    document.getElementById(
        'course-code'
    );


const buildingElement =
    document.getElementById(
        'building-name'
    );


const floorElement =
    document.getElementById(
        'floor-number'
    );


const roomElement =
    document.getElementById(
        'room-number'
    );


/* ==================================================
   DISPLAY INFORMATION
================================================== */

function displayLocationInformation() {


    if (courseElement) {

        courseElement.textContent =
            course || 'Not specified';

    }


    if (buildingElement) {

        buildingElement.textContent =
            building || 'Not specified';

    }


    if (floorElement) {

        floorElement.textContent =
            floor || 'Not specified';

    }


    if (roomElement) {

        roomElement.textContent =
            room || 'Not specified';

    }

}


/* ==================================================
   UPDATE PAGE TITLE
================================================== */

function updateDestinationTitle() {

    const title =
        document.getElementById(
            'destination-title'
        );


    if (!title) {
        return;
    }


    if (building && room) {

        title.textContent =
            `${building} - Room ${room}`;

    }
    else if (building) {

        title.textContent =
            building;

    }
    else {

        title.textContent =
            'Examination Room';

    }

}


/* ==================================================
   SHOW ERROR
================================================== */

function showMapError(message) {

    const error =
        document.getElementById(
            'map-error'
        );


    if (!error) {
        return;
    }


    error.textContent =
        message;


    error.style.display =
        'block';

}


/* ==================================================
   CHECK LOCATION
================================================== */

function validateLocation() {

    if (!building) {

        showMapError(
            'No examination building was selected. Please return to the student search page and select "View Location".'
        );

        return false;

    }


    return true;

}


/* ==================================================
   START
================================================== */

displayLocationInformation();

updateDestinationTitle();

validateLocation();