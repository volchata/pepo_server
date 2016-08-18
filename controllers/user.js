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
    res.json({login: req.user.login, id: req.user.id, provider: req.user.provider});
}

module.exports = {
    getUsers,
    user
};
