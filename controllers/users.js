'use strict';
var userToData = require('./user.js').userToData;
var User = require('../models/user').User;

var foreignUserFields = {
    displayName: 1,
    avatar: 1,
    firstName: 1,
    lastName: 1,
    _id: 0};
function foreignUserToData(user) {
    return userToData(user);
}

function getUserByLogin(req, res, next) {
    var displayName = req.params.login;
    User.byDisplayname(displayName).exec( function (err, user) {
        if (err) {
            next(err);
        } else if (!user) {
            res.status(404).send({status: 'Not found'});
        } else {
            res.json(foreignUserToData(user));
        }
    });
}
function getUserChildCollection(child, mapBy) {
    return function (req, res, next) {
        var displayName = req.params.login;
        var limit = req.params.limit || 50;
        var offset = req.params.offset || 0;
        User.byDisplayname(displayName).select(child).exec( function (err, user) {
            if (err) {
                next(err);
            } else if (!user) {
                res.status(404).send({status: 'Not found'});
            } else {
                if (typeof user[child][0] !== 'undefined') {
                    var len = user[child].length;
                    var ids = user[child].slice(offset, offset + limit + 1);
                    User.find().where('_id').in(ids).select(foreignUserFields).exec(function (err, users) {
                        if (err) {
                            next(err);
                        } else {
                            var data = {};
                            data.data = users.map(mapBy);
                            data.limit = limit;
                            data.total = len;
                            data.offset = offset;
                            res.json(data);
                        }
                    });
                } else {
                    res.status(204).send();
                }

                //res.json(foreignUserToData(user));
            }});
    };
}
var getUserFolowers = getUserChildCollection('folowers', foreignUserToData);
//var getUserFolowed=getUserChildCollection('followed',getUserByLogin);

module.exports = {
    foreignUserToData,
    getUserByLogin,
    getUserFolowers
};
