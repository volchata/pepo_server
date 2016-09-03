'use strict';

var passport = require('../libs/passport');

function restartAuth(res) {
    return res.redirect('/auth/');
}

// eslint-disable-next-line no-unused-vars
function startApp(req, res) {
    return res.redirect('/feed');
}

function logout(req, res) {
    req.logout();
    if (req.session) {
        req.session.destroy();
    }
    res.redirect('/');
}

var User = require('../models/user').User;
function ensureAuthenticatedAPI(req, res, next) {
    if (/woauth/.test(process.env.NODE_ENV)) {
        return User.findOne({}, function (err, user) {
            if (err) {
                console.log('Err', err);return next(err);
            }
            req.user = user;
            console.log('Without auth env');
            return next();
        });

    }
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.status(403).json({status: 'Unauthenticated'});
    }
    return next();
}

// eslint-disable-next-line no-unused-vars
function ensureAuthenticated(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return restartAuth(res);
    } else {
        return next();
    }
}

function ensureRegistered(req, res, next) {
    if (req.user.notRegistered) {
        return res.redirect('/signup');
    } else {
        return next();
    }
}

function ensureRegisteredAPI(req, res, next) {
    if (req.user.notRegistered) {
        return res.status(403).json({status: 'PartialRegistration'});
    } else {
        return next();
    }
}

function authenticatorFabric(authStrategy) {
    return function (req, res, next) {
        // eslint-disable-next-line no-unused-vars
        passport.authenticate(authStrategy, function (err, user, info) {
            // console.log('Here', user, err);
            if ( (!user) || (err) ) {
                return restartAuth(res);
            }
            return req.logIn(user, function (err) {
                if (err) {
                    return restartAuth(res);
                }
                return startApp(res);
            });
        })(req, res, next);
    };
}

// eslint-disable-next-line no-unused-vars
function wrongAPIPoint(req, res, next) {
    return res.status(404).json({status: 'WrongAPIPoint'});
}

// eslint-disable-next-line no-unused-vars
function responder404(req, res, next) {
    var str = '<h1>:\'-(</h1> ';
    str += '<h2>То, что вы искали не нашлось...</h2>';
    str += '<h3>Нам очень жаль.. Правда.. </h3>';
    str += '<a href="/">Попробуйте начать сначала! :)</a>';
    res.status(500).send(str);
}

module.exports = {
    responder404,
    logout,
    startApp,
    wrongAPIPoint,
    ensureAuthenticated,
    ensureAuthenticatedAPI,
    ensureRegistered,
    ensureRegisteredAPI,
    authVK: authenticatorFabric('vkontakte'),
    authFB: authenticatorFabric('facebook')
};
