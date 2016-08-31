'use strict';

var User = require('../models/user').User;
var webPref = require('../conf').get('storage:web');
var localImg = new RegExp( textEscapeForRE(webPref), 'i');
var img = require('./images');

function textEscapeForRE(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\n|\r|\n\r|\r\n/g, '');
}

function userToData(user) {
    var data = {
        displayName: user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description,
        avatar: user.avatar ? user.avatar : 'http://placehold.it/100x100'
    };
    if (typeof user.followers !== 'undefined') {
        data.followers = user.followers.length;
    }
    if (typeof user.follows !== 'undefined') {
        data.follows = user.follows.length;
    }

    if (user.notRegistered) {
        data.notRegistered = true;
    }
    return data;
}

/**
 * @api {get} /api/user Get user profile
 * @apiGroup User
 * @apiName GetUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {String} notRegistered Set if user does not send initial profile update after social login
 * @apiSuccess (200) {Number} followers Number of user's followers
 * @apiSuccess (200) {Number} follows Number of persons that user follows
 * @apiError (Errors) 403 Access denied
 * @param req
 * @param res
 */
function user(req, res) {

    res.json(userToData(req.user));
}

/**
 * @api {post} /api/user Update user profile
 * @apiGroup User
 * @apiName PostUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {String} notRegistered Set if user does not send initial profile update after social login
 * @apiError (Errors) 409 Duplicate key
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 400 Error
 * @param req
 * @param res
 */
function postUser(req, res) {
    var modified = false;
    var data = {};
    for (var i of ['displayName', 'firstName', 'lastName', 'description']) {
        if (typeof req.body[i] !== 'undefined') {
            req.user[i] = String(req.body[i]).trim();
            data[i] = req.user[i];
            modified = true;
        }
    }

    if (req.file) {
        modified = true;
        if (localImg.test(req.user.avatar)) {
            img.removeFile(req.user.avatar); // не ждём завершения процесса
        }
        req.user.avatar = req.file.url;
    }

    if (modified) {
        req.user.notRegistered = false;
        data.notRegistered = false;
        req.user.save(function (err) {
            if (req.file) {
                img.commitFile(req.file);
            }
            if (err) {
                if ( err.code === 11000 ) {
                    res.status(409).send({status: 'Duplicate key'});
                } else {
                    res.status(400).send({status: 'Error saving data'});
                }

            } else {
                user(req, res);
            }
        });
    } else {
        user(req, res);
    }

}

function followUser(req, res, next) {

    var flogin = req.param.login;

    User.getByLogin( flogin, res, next).then( (fuser) => {

        var sid = req.user._id;
        var func = {followers: req.user._id};
        // console.log('Sid', sid, fuser.followers);

        if (req.method === 'POST') {
            if (fuser.followers.indexOf(sid) > -1) {
                return res.json(userToData(fuser));
            }
            func = {$push: func};
        } else if (req.method === 'DELETE') {
            if (fuser.followers.indexOf(sid) === -1) {
                return res.json(userToData(fuser));
            }
            func = {$pull: func};
        }

        User.findOneAndUpdate(
            {
                displayName: flogin,
                notRegistered: false
            },
            func,
            function (err, user) {
                if (err) {
                    return next(err);
                }
                if (user) {
                    return res.json(userToData(user));
                } else {
                    res.status(404).json({status: 'User not found'});
                }
            }
        );

    } );
}

// eslint-disable-next-line no-unused-vars
function uploadImage(req, res, next) {
    if (req.file) {
        res.status(200).json({status: 'OK', url: req.file.url});
    }
    res.status(400).json({status: 'File not found'});
}

module.exports = {
    uploadImage,
    user,
    postUser,
    userToData,
    followUser
};
