'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var session = require('express-session');
// var slashes = require('connect-slashes');
var router = require('./router');
var passport = require('passport');
var config = require('./conf');
var mongoose = require('./libs/mongoose-connect');
var MongoStore = require('connect-mongo')(session);

// в среде тестирования это не выводим
if (!(/test/.test(process.env.NODE_ENV))) {
    app.use(morgan('combined'));
}

app
    .disable('x-powered-by')
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .use(session({
        secret: config.get('sessionSecret'),
        resave: false,
        saveUninitialized: false,
        cookie: {maxAge: 7 * 24 * 60 * 60 * 1000}, //, secure: true }, // one week
        unset: 'destroy',
        store: new MongoStore({mongooseConnection: mongoose.connection,
                autoRemove: 'native',
                ttl: 14 * 24 * 60 * 60,
                touchAfter: 10 * 60,
                stringify: false
        })
    }))
    .use(passport.initialize())
    .use(passport.session());
    // .use(slashes());

router(app);

app.use(errorHandler);

 /*eslint-disable no-unused-vars */
function errorHandler(err, req, res, next) {
    console.log('Error ocurred: ', err);
    res.status(500).json({status: 'Application error, try later'});
}
/*eslint-enable no-alert */

app.listen(config.get('server:port'), function () {
    console.log('listening at %s:%s', config.get('server:host'), config.get('server:port'));
    console.log('Proxyfing to %s:%s', config.get('client:host'), config.get('client:port'));
});

module.exports.app = app;
