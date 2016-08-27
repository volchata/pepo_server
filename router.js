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

apiRouter                                   // в этот роутер попадают только точки API, для них нужны:
    .use(controllers.auth.ensureAuthenticatedAPI) // обязательная проверка аутентификации пользователя
    .use(controllers.cors)                  // и заголовки Cross origin resourse sharing
                                            // всё что указано ниже будет работать только после аутентификации
    .get('/user', controllers.user.user)
    .use('/user/*', controllers.currentUser)
    .get('/users', controllers.user.getUsers)
    //.post('/api/user', controllers.user.postUser)
    .post('/user/:id', controllers.user.stub); // stub

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
