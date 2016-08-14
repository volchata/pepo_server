'use strict';

var fs = require('fs'),
    path = require('path'),
    express = require('express'),
    router = require('./router'),
    app = express(),
    expressSession = require('express-session'),
    bodyParser = require('body-parser'),
    morgan = require('morgan'),
    cookieSession = require('cookie-session'),
    slashes = require('connect-slashes'),

    passport = require('passport'),
    config = require('./conf'),

    port = process.env.PORT || config.defaultPort;

app
    .use(morgan('combined'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({ extended: false }))
    .use(cookieSession({ keys: [config.get("sessionSecret")] }))
    .use(passport.initialize())
    .use(passport.session())
    .use(slashes())
    .use(router);

app.listen(config.get('server:port'), function () {
    console.log('listening at %s', config.get('server:port'));
});
