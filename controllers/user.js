'use strict';

var User = require('../models/user').User;
var textEscapeForRE = require('../libs/utils').textEscapeForRE;
var users = require('./users');
var img = require('./images');

var webPref = require('../conf').get('storage:web');
var localImg = new RegExp( textEscapeForRE(webPref), 'i');

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
 * @apiSuccess (200) {Boolean} notRegistered Set if user does not send initial profile update after social login
 * @apiSuccess (200) {Array} tweetsILike Last tweets user likes
 * @apiSuccess (200) {Array} tweetsImages Last tweets with images user likes
 * @apiSuccess (200) {Array} tweets Last user tweets
 * @apiSuccess (200) {Object} users Users for tweets collection. At least contains current user.
 * @apiSuccess (200) {Number} followers Number of user's followers
 * @apiSuccess (200) {Number} follows Number of persons that user follows
 * @apiError (Errors) 403 Access denied
 * @param req
 * @param res
 */
function user(req, res, next) {
    users.getUserProfile(req.user, req.geoip).then((userData) => {
        res.json(userData);
    }).catch(next);
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
    for (var i of ['displayName', 'firstName', 'lastName', 'description']) {
        if (typeof req.body[i] !== 'undefined') {
            req.user[i] = String(req.body[i]).trim();
            modified = true;
        }
    }
/*eslint-disable no-eq-null,eqeqeq */
    if (req.body.avatar != null) {
        modified = true;
        if (localImg.test(req.user.avatar)) {
            img.removeFile(req.user.avatar); // не ждём завершения процесса
        }
        req.user.avatar = req.body.avatar;
    }

    if (modified) {
        req.user.notRegistered = false;
        req.user.save(function (err) {
            if (req.body.avatar) {
                img.commitFile(req.body.avatar);
            }
            if (err) {
                if ( err.code === 11000 || err.code === 11001 ) {
                    res.status(409).json({status: 'Duplicate key'});
                } else {
                    res.status(400).json({status: 'Error saving data'});
                }

            } else {
                user(req, res);
            }
        });
    } else {
        user(req, res);
    }

}

function getUserInterest(req, res, next) {
    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]
    })
    .exec((err, user) => {
        User.find({
            $and: [
                {interests: {$in: user.interests}},
                {_id: {$nin: user.follows}},
                {_id: {$ne: user._id}}
            ]
        })
        .exec((err, users) => {
            console.log('users', users);
            res.status(200).json(users);
        });
    });
}
/**
 * @api {delete} /users/:login/follower Stop follow user
 * @apiDescription Current user stop follow user whith displayName :login
 * @apiGroup User
 * @apiName StopFollowUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {Number} follows Number of person user follows
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 */

/**
 * @api {post} /users/:login/follower Follow user
 * @apiDescription Current user start follow user whith displayName :login
 * @apiGroup User
 * @apiName FollowUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {Number} follows Number of person user follows
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 */

function followUser(req, res, next) {

    var flogin = req.params.login;
    //var sid = req.user._id;
    User.byDisplayname(flogin).exec(function (err, fuser) {
        if (err) {
            next(err);
        } else if (!fuser) {
            res.status(404).json({status: 'User not found'});
        } else {
            //POST ONLY
            var queries = (req.method === 'POST') ? [{
                $addToSet: {
                    followers: req.user._id
                }
            }, {
                $addToSet: {
                    follows: fuser._id
                }
            }] : [{
                $pull: {
                    followers: req.user._id
                }
            }, {
                $pull: {
                    follows: fuser._id
                }
            }];

            var p1 = User.findByIdAndUpdate({_id: fuser._id}, queries[0], {
                new: true
            }).exec();
            var p2 = User.findByIdAndUpdate({_id: req.user._id}, queries[1], {
                new: true
            }).exec();

            Promise.all([p1, p2]).then(function (stats) {
                return res.json(users.userToData(stats[1]));
            }).catch(next);
        }
    });
}

module.exports = {
    user,
    postUser,
    followUser,
    getUserInterest
};
