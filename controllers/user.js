'use strict';

var User = require('../models/user').User;
var Tweet = require('../models/tweet').Tweet;
var textEscapeForRE = require('../libs/utils').textEscapeForRE;
var userToData = require('../libs/utils').userToData;
var webPref = require('../conf').get('storage:web');
var localImg = new RegExp( textEscapeForRE(webPref), 'i');
var usersCtr = require('../controllers/users');
var img = require('./images');
var when = require('when');

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
    Tweet.userTweetsCombined(req.user).then(function (stat) {
        var userData = userToData(req.user);
        var resData = {};
        var obj = usersCtr.tweetsToJson(stat[2], req.user);
        resData.tweetsILike = obj.tweets;
        obj = usersCtr.tweetsToJson(stat[1], req.user, obj.users);
        resData.tweetsImages = obj.tweets;
        obj = usersCtr.tweetsToJson(stat[0], req.user, obj.users);
        resData.tweets = obj.tweets;
        resData.users = obj.users;
        //res = Object.assign(userData, res);
        //res.json(obj);
        usersCtr.loadUsersToObj(resData.users).then(function () {
                //cb( {tweets: obj.tweets, users: users} );
            resData = Object.assign(userData, resData);
            if (req.geoip !== undefined) {
                resData.geoIpInfo = req.geoip;
            }
             //console.log(['GGG', res]);
            res.json(resData);

        }).catch(next);

    }).catch(next);
    //res.json(userToData(req.user));
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

            when.all([p1, p2]).then(function (stats) {
                return res.json(userToData(stats[1]));
            }).catch(function (err) {
                next(err);
            });
        }
    });
}

module.exports = {
    user,
    postUser,
    followUser
};
