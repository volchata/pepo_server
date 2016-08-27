'use strict';
var userToData = require('./user.js').userToData;
var User = require('../models/user').User;

function foreignUserToData(user) {
    return userToData(user);
}
function getUserByLogin(req, res) {
    var displayName = req.params.login;
    User.findOne({
        $and: [{displayName: displayName}, {notRegistered: false}]
    }, function (err, user) {
        if (err) {
            res.status(500);
        } else if (!user) {
            res.status(404).send({status: 'Not found'});
        } else {
            res.json(foreignUserToData(user));
        }
    });
}

module.exports = {
    foreignUserToData,
    getUserByLogin
};
