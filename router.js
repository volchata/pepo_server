'use strict';

var express = require('express');
var apiRouter = express.Router();
var commonRouter = express.Router();
var controllers = require('./controllers');
var rproxy = require('./libs/rproxy');
var config = require('./conf');

var img = controllers.images;

// var snap = controllers.snapshot;

commonRouter        // роутер для обычных путей аутентификации
    .get('/auth/', rproxy)
    .get('/auth/vk', controllers.auth.authVK)
    .get('/auth/vk/callback', controllers.auth.authVK)
    .get('/auth/fb', controllers.auth.authFB)
    .get('/auth/fb/callback', controllers.auth.authFB)
    .use('/doc/api', express.static('apidoc'))
    .use(config.get('storage:web'), express.static( config.get('storage:dir') ), controllers.auth.responder404)
    .get('/favicon.ico', rproxy)
    .get(/\.js$|\.css$/, rproxy)
    .use(controllers.auth.ensureAuthenticated)  // точка проверки аутентификации
    .get('/signup', rproxy)
    .get('/signup/', rproxy)
    .get('/logout', controllers.auth.logout)
    .use(controllers.auth.ensureRegistered)     // точка проверки регистрации
    .get('/', controllers.auth.startApp)
    .get('*', rproxy);

apiRouter
    .use(controllers.auth.ensureAuthenticatedAPI)               // обязательная проверка аутентификации пользователя
    .use(controllers.cors)                                      // и заголовки Cross origin resourse sharing

    .use(controllers.geoIpInfo)
    .get('/user', controllers.user.user)
    //.get('/user', controllers.geoIpInfo, controllers.user.user)
    .post('/user', controllers.user.postUser)
    .use(controllers.auth.ensureRegisteredAPI)                 // точка проверки регистрации
    .get('/users/:search/search', controllers.users.searchUsers)
    .get('/user/interest', controllers.user.getUserInterest)
    .get('/users/:login', controllers.users.getUserByLogin)
    .get('/users/:login/feed', controllers.tweet.getTweets)
    .get('/users/:login/followers', controllers.limitData, controllers.users.getUserFollowers)
    .get('/users/:login/follows', controllers.limitData, controllers.users.getUserFollows)
    .get('/user/feed', controllers.tweet.getTweets)
    .get('/user/feed/history', controllers.tweet.getHistory)
    .get('/tweet/:id/comments', controllers.tweet.getComments)
    .get('/tweet/:id', controllers.tweet.getTweet)
    .post('/user/feed', controllers.tweet.setTweet)
    .post('/user/image', img.preAdd('file'), img.uploadImage)
    .post('/user/snapshot', img.makeSnapshot)
    .get('/user/snapshot/:url([\/a-z0-9_.]+)', img.getSnapshot)
    .get('/interest', controllers.interest.getInterest)
    .post('/users/:login/follower', controllers.user.followUser)

    .post('/interest', controllers.interest.postInterest)

    .post('/tweet/:id/retweet', controllers.tweet.reTweet)
    .post('/tweet/:id', controllers.tweet.commentTweet)
    .post('/tweet/:id/like', controllers.tweet.likeTweet)
    .delete('/users/:login/follower', controllers.user.followUser)
    .delete('/tweet/:id/like', controllers.tweet.likeTweet)
    .delete('/tweet/:id', controllers.tweet.deleteTweet)
    .delete('/tweet/:id/retweet', controllers.tweet.deleteReTweet)
    .get('/geo', controllers.geo.getGeoIp)
    .use(controllers.auth.wrongAPIPoint);

module.exports = function (app) {
    app
        .use('/api', apiRouter)
        .use(commonRouter);
};
