'use strict';

var express = require('express'),
    router = express.Router(),
    controllers = require('./controllers'),
    passport = require('./libs/auth');

router
    .get('/', controllers.mainPage.hello)
    .get('/login', controllers.login.login)
    .get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    })
    //receive all users from DB in json
    .get('/users', controllers.user.getUsers)
    .get('/user', controllers.user.user)

    .get('/auth/vk',
        passport.authenticate('vkontakte', {
            scope: ['friends']
        }),
        function (req, res) {
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
