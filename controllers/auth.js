'use strict';

var passport = require('../libs/passport');

function restartAuth(res) {
    return res.redirect('/auth/');
}

function startApp(res) {
    return res.redirect('/feed');
}

function logout(req, res) {
    req.logout();
    if (req.session) {
        req.session.destroy();
    }
    res.redirect('/');
}

function ensureAuthenticatedAPI(req, res, next) {
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

module.exports = {
    logout,
    wrongAPIPoint,
    ensureAuthenticated,
    ensureAuthenticatedAPI,
    ensureRegistered,
    ensureRegisteredAPI,
    authVK: authenticatorFabric('vkontakte'),
    authFB: authenticatorFabric('facebook')
};
