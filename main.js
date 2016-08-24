'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var session = require('express-session');
var slashes = require('connect-slashes');
var router = require('./router');
var passport = require('passport');
var config = require('./conf');

// в среде тестирования это не выводим
if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('combined'));
}

app
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .use(session({
        secret: config.get('sessionSecret'),
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 7 * 24 * 60 * 60 * 1000}, //, secure: true }, // one week
        unset: 'destroy'
        // store: new MongoStore({ dbPromise: db.dbPromise,
        //         autoRemove: 'native',
        //         ttl: 14 * 24 * 60 * 60,
        //         touchAfter: 10 * 60,
        //         stringify: false
        // })
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(slashes());

router(app);

app.listen(config.get('server:port'), function () {
    console.log('listening at %s:%s', config.get('server:host'), config.get('server:port'));
});

module.exports.app = app;
