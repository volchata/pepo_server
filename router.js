'use strict';

var express = require('express'),
    router = express.Router(),
    controllers = require('./controllers'),
    passport = require('./libs/auth');

router
    .get('/', controllers.mainPage.hello)
    .get('/users', controllers.user.getUsers)

    .get('/auth/vk',
        passport.authenticate('vkontakte', {
            scope: ['friends']
        }),
        function (req, res) {
        })
    .get('/auth/vk/callback',
        passport.authenticate('vkontakte'),
        function (req, res) {
            res.redirect('/');
        })

    .get('/auth/fb',
        passport.authenticate('facebook', {
            scope: 'public_profile'
        })
    )
    .get('/auth/fb/callback',
        passport.authenticate('facebook', {
            successRedirect: '/'
        })
    );
 

module.exports = router;
