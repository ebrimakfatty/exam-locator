require('dotenv').config();

const express = require('express');
const path = require('path');
const session = require('express-session');

const app = express();

/* =====================================
   MIDDLEWARE
===================================== */

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


/* =====================================
   SESSION
===================================== */

app.use(
    session({
        secret:
            process.env.SESSION_SECRET ||
            'exam_locator_secret',

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: false,
            maxAge: 1000 * 60 * 60
        }
    })
);


/* =====================================
   STATIC FILES
===================================== */

app.use(
    express.static(
        path.join(__dirname, '../public')
    )
);


/* =====================================
   CONNECT ROUTES
===================================== */

// Admin routes
const adminRouter =
    require('./routes/admin');

// Student search routes
const searchRouter =
    require('./routes/search');


/* =====================================
   USE ROUTES
===================================== */

// Anything starting with
// /api/admin
// goes to routes/admin.js

app.use(
    '/api/admin',
    adminRouter
);


// Anything starting with
// /api/search
// goes to routes/search.js

app.use(
    '/api/search',
    searchRouter
);


/* =====================================
   HOME PAGE
===================================== */

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '../public/index.html'
        )
    );

});


/* =====================================
   404
===================================== */

app.use((req, res) => {

    res.status(404).json({
        error: 'Route not found'
    });

});


/* =====================================
   ERROR HANDLER
===================================== */

app.use((err, req, res, next) => {

    console.error(
        'Server error:',
        err
    );

    res.status(500).json({
        error: 'Internal server error'
    });

});


/* =====================================
   EXPORT
===================================== */

module.exports = app;