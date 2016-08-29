'use strict';

var express = require('express');
var apiRouter = express.Router();
var commonRouter = express.Router();
var controllers = require('./controllers');
var rproxy = require('./libs/rproxy');
var config = require('./conf');

var img = controllers.images;

commonRouter        // роутер для обычных путей аутентификации
    .use('/doc/api', express.static('apidoc'))
    .get('/auth/', rproxy)
    .get('/auth/vk', controllers.auth.authVK)
    .get('/auth/vk/callback', controllers.auth.authVK)
    .get('/auth/fb', controllers.auth.authFB)
    .get('/auth/fb/callback', controllers.auth.authFB)
    .use(config.get('storage:web'), express.static( config.get('storage:dir') ))
    .get('/favicon.ico', rproxy)
    .get(/\.js$|\.css$/, rproxy)
    .use(controllers.auth.ensureAuthenticated)  // точка проверки аутентификации
    .get('/signup', rproxy)
    .get('/signup/', rproxy)
    .get('/users-search', rproxy)
    .get('/users-search/', rproxy)
    .get('/compose', rproxy)
    .get('/compose/', rproxy)
    .get('/profile', rproxy)
    .get('/profile/', rproxy)
    .get('/logout', controllers.auth.logout)
    .use(controllers.auth.ensureRegistered)     // точка проверки регистрации
    .get('/feed/', rproxy)
    .get('/feed', rproxy);

apiRouter
    .use(controllers.auth.ensureAuthenticatedAPI)               // обязательная проверка аутентификации пользователя
    .use(controllers.cors)                                      // и заголовки Cross origin resourse sharing
    .get('/user', controllers.user.user)
    .post('/user', img.preAdd('avatar'), controllers.user.postUser)
    // .use(controllers.auth.ensureRegisteredAPI)                 // точка проверки регистрации
    .post('/user', controllers.user.postUser)
    .get('/users/:search', controllers.users.searchUsers)
    .get('/users/:login', controllers.users.getUserByLogin)
    .get('/users/:login/feed', controllers.tweet.getTweets)
    .get('/users/:login/folowers', controllers.limitData, controllers.users.getUserFolowers)
    .get('/user/feed', controllers.tweet.getTweets)
    .get('/tweet/:id', controllers.tweet.getTweet)
    .post('/user/feed', img.preAdd('image'), controllers.tweet.setTweet)
    .post('/users/:login/follower', controllers.user.followUser)
    .post('/tweet/:id/retweet', controllers.tweet.reTweet)
    .post('/tweet/:id', img.preAdd('image'), controllers.tweet.commentTweet)
    .post('/tweet/:id/like', controllers.tweet.likeTweet)
    .delete('/tweet/:id', controllers.tweet.deleteTweet)
    .delete('/users/:login/follower', controllers.user.followUser)
;

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
