'use strict';

var express = require('express');
var router = express.Router();
var controllers = require('./controllers');
var passport = require('./libs/auth');

router
    .use(controllers.corps)
    .get('/auth', controllers.mainPage.hello)
    .get('/login', controllers.login.login)
    .get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    })
    //receive all users from DB in json
    .get('/users', controllers.user.getUsers)
    .get('/user', controllers.user.user)

    .get('/api/user/:login/feed', controllers.tweet.getTweets)
    .post('/api/user/:login/feed', controllers.tweet.setTweet)
    .post('/api/tweet/:id/retweet', controllers.tweet.retweet)
    .post('/api/tweet/:id', controllers.tweet.commentTweet)

    .get('/auth/vk',
        passport.authenticate('vkontakte', {
            scope: ['friends']
        }),
        function () {
        })
    .get('/auth/vk/callback',
        passport.authenticate('vkontakte'),
        function (req, res) {
            res.redirect('/user');
        })

    .get('/auth/fb',
        passport.authenticate('facebook', {
            scope: 'public_profile'
        })
    )
    .get('/auth/fb/callback',
        passport.authenticate('facebook', {
            successRedirect: '/user'
        })
    );

module.exports = router;
