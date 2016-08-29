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
    .post('/user', controllers.user.postUser)
    .get('/users/:login', controllers.users.getUserByLogin)
    .get('/users/:login/feed', controllers.tweet.getTweets)
    .get('/users/:login/folowers', controllers.limitData, controllers.users.getUserFolowers)
    .get('/user/feed', controllers.tweet.getTweets)
    .get('/tweet/:id', controllers.tweet.getTweet)
    .post('/user/feed', controllers.tweet.setTweet)
    .post('/tweet/:id/retweet', controllers.tweet.reTweet)
    .post('/tweet/:id', controllers.tweet.commentTweet)
    .post('/tweet/:id/like', controllers.tweet.likeTweet)
    .delete('/tweet/:id', controllers.tweet.deleteTweet)

;

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
