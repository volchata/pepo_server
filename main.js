'use strict';

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var morgan = require('morgan');
var cookieSession = require('cookie-session');
var slashes = require('connect-slashes');
var router = require('./router');
var passport = require('passport');
var config = require('./conf');

app
    .use(morgan('combined'))
    .use(bodyParser.json())
    .use(bodyParser.urlencoded({extended: false}))
    .use(cookieSession({keys: [config.get('sessionSecret')]}))
    .use(passport.initialize())
    .use(passport.session())
    .use(slashes())
    .use(router);

app.listen(config.get('server:port'), function () {
    console.log('listening at %s', config.get('server:port'));
});
