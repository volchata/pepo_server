'use strict';

var express = require('express');
var apiRouter = express.Router();
var commonRouter = express.Router();
var controllers = require('./controllers');
var rproxy = require('./libs/rproxy');

commonRouter        // роутер для обычных путей аутентификации
    .get('/auth/', rproxy)
    .get('/auth/vk', controllers.auth.authVK)
    .get('/auth/vk/callback', controllers.auth.authVK)
    .get('/auth/fb', controllers.auth.authFB)
    .get('/auth/fb/callback', controllers.auth.authFB)
    .get('/favicon.ico', rproxy)
    .get(/\.js$|\.css$/, rproxy)
    .use(controllers.auth.ensureAuthenticated)  // точка проверки аутентификации
    .get('/logout', controllers.auth.logout)
    .get('/feed/', rproxy)
    .get('/feed', rproxy)
    .get('/signup/', rproxy);

apiRouter
    .use(controllers.auth.ensureAuthenticatedAPI)
    .use(controllers.cors)

    .get('/user', controllers.user.user)
    .post('/user', controllers.user.postUser);

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
