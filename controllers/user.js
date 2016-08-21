'use strict';

var User = require('../models/user').User;

function getUsers(req, res, next) {
    User.find({}, (err, users) => {
        if (err) {
            return next(err);
        }
        res.json(users);
    });
}

function user(req, res) {
    res.json({
        displayName: req.user.displayName,
        socialNetworkId: req.user.socialNetworkId,
        provider: req.user.provider,
        isRegistered: req.user.isRegistered,
        firstName: req.user.firstName,
        lastName: req.user.lastName
    });
}

function postUser(req, res) {
    var modified = false;
    if (typeof req.body.displayName !== 'undefined') {
        req.user.displayName = String(req.body.displayName).trim();
        modified = true;
    }
    if (typeof req.body.firstName !== 'undefined') {
        req.user.firstName = String(req.body.firstName).trim();
        modified = true;
    }
    if (typeof req.body.lastName !== 'undefined') {
        req.user.lastName = String(req.body.lastName).trim();
        modified = true;
    }
    if (modified) {
        req.user.isRegistered = true;
        req.user.save(function (err) {
            if (err) {
                res.status(400).send(err);
            } else {
                res.redirect('/api/user');
            }
        });
    } else {
        res.redirect('/api/user');
    }

}

function stub(req, res) {
    res.json({stub: 'data'});
}

module.exports = {
    getUsers,
    user,
    stub,
    postUser
};
