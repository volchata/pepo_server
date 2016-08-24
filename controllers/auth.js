'use strict';

var passport = require('../libs/passport');

function send403(res) {
    return res.status(403).json({status: 'Unauthenticated'});
}

function restartAuth(res) {
    return res.redirect('/auth');
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
        return send403(res);
    }
    return next();
}

// eslint-disable-next-line no-unused-vars
function ensureAuthenticated(req, res, next) {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        return res.redirect('/auth');
    } else {
        return res.redirect('/feed');
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

module.exports = {
    logout,
    ensureAuthenticated,
    ensureAuthenticatedAPI,
    authVK: authenticatorFabric('vkontakte'),
    authFB: authenticatorFabric('facebook')
};
