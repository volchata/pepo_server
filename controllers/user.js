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
        provider: req.user.provider});
}

function stub(req, res) {
    res.json({stub: 'data'});
}

module.exports = {
    getUsers,
    user,
    stub
};
