'use strict';

var express = require('express');
var apiRouter = express.Router();
var commonRouter = express.Router();
var controllers = require('./controllers');

commonRouter        // роутер для обычных путей аутентификации
    .use(controllers.auth.ensureAuthenticated)
    .get('/logout', controllers.auth.logout)
    .get('/auth/vk', controllers.auth.authVK)
    .get('/auth/vk/callback', controllers.auth.authVK)
    .get('/auth/fb', controllers.auth.authFB)
    .get('/auth/fb/callback', controllers.auth.authFB);

apiRouter                                   // в этот роутер попадают только точки API, для них нужны:
    .use(controllers.auth.ensureAuthenticatedAPI) // обязательная проверка аутентификации пользователя
    .use(controllers.cors)                  // и заголовки Cross origin resourse sharing
                                            // всё что указано ниже будет работать только после аутентификации
    .get('/user', controllers.user.user)
    .post('/user', controllers.user.postUser);

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
