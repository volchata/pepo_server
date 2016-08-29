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
/**
 * @api {get} /api/users/:login Get foreign user profile
 * @apiDescription Return profile of user identified by :login
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiParam {String} :login User login
 * @apiSuccess (200) {String} displayName Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {Boolean} notRegistered Set if user does not send initial profile update after social login
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 * @param next
 */
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

function searchUsers(req, res, next) {
    var search = req.params.search.trim();
    User.search(search).limit(10).exec(
        function (err, users) {
            if (err) {
                next(err);
            } else if ((!users) || users.length === 0) {
                res.status(404).send({status: 'Not found'});
            } else {
                res.json(users.map(foreignUserToData));
            }}
    );
}

module.exports = {
    foreignUserToData,
    getUserByLogin,
    getUserFolowers,
    searchUsers
};
