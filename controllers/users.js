'use strict';
var User = require('../models/user').User;
var Tweet = require('../models/tweet').Tweet;
var parseTweet = require('./tweetAPI').parseTweet;

var foreignUserFields = {
    displayName: 1,
    avatar: 1,
    firstName: 1,
    lastName: 1,
    _id: 0
};

function foreignUserToData(user) {
    return myForeignUserToData(null, user);
}
function myForeignUserToData(me, user) {
    var meFollow;
    var data = userToData(user);
    if (me) {
        meFollow = me.follows.some(function (foll) {
            return foll.equals(user.id);
        });
        if (meFollow) {
            data.followed = true;
        }
    }
    return data;
}

function userToData(user) {
    var data = {
        displayName: user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description
        // avatar: user.avatar ? user.avatar : 'http://placehold.it/100x100'
    };
    if (user.avatar) {
        data.avatar = user.avatar;
    }
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

function getUserProfile(user, geoip) {
    return Tweet.userTweetsCombined(user).then(function (stat) {
        return Promise.all(
            stat.map((s) => parseTweet(s, user))
        );
    }).then((stat)=>{
        var userData = userToData(user);
        ['tweets_last', 'tweets_pics', 'tweets_liked'].forEach((name, idx)=>{
            userData[name] = stat[idx];
        });
        if (geoip != null) {  // eslint-disable-line no-eq-null,eqeqeq
            userData.geoIpInfo = geoip;
        }
        return userData;
    });
}

/**
 * @api {get} /api/users/:login Get foreign user profile
 * @apiDescription Return profile of user identified by :login
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiParam {String} :login User login
 * @apiSuccess (200) {Boolean} followed Set if user is followed by current user
 * @apiSuccess (200) {Array} tweets Last user tweets
 * @apiSuccess (200) {Object} users Users for tweets collection. At least contains current user.
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 * @param next
 */
function getUserByLogin(req, res, next) {
    var displayName = req.params.login;
    User.byDisplayname(displayName).exec()
    .then( (user) => {
        if (!user) {
            throw {type: 404}; // eslint-disable-line no-throw-literal
        }
        return getUserProfile(req.user, req.geoip);
    }).then((userData) => {
        res.json(userData);
    }).catch((e)=>{
        if (e.type === 404) {
            return res.status(404).send({status: 'Not found'});
        }
        throw e;
    }).catch(next);
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
                    var ids = user[child].slice(offset, offset + limit );
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
/**
 * @api {get} /api/users/:login/followers?limit=:limit&offset=:offset Get user followers
 * @apiDescription Return followers of user identified by :login
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiParam {String} :login User login
 * @apiParam {Number} :limit Optional. Allowed values from 0—50
 * @apiParam {Number} :offset  Optional Allowed positive values
 * @apiSuccess (200) {String} data Array of information about followers
 * @apiSuccess (200) {String} limit Limit for data size
 * @apiSuccess (200) {String} offset Offset for data size
 * @apiSuccess (200) {String} total Total size of followers list
 * @apiSuccess (204) 204 User has no followers
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 * @param next
 */
var getUserFollowers = getUserChildCollection('followers', foreignUserToData);
/**
 * @api {get} /api/users/:login/follows?limit=:limit&offset=:offset Get user follows
 * @apiDescription Return list of users that follows user identified by :login
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiParam {String} :login User login
 * @apiParam {Number} :limit Optional. Allowed values from 0—50
 * @apiParam {Number} :offset  Optional Allowed positive values
 * @apiSuccess (200) {String} data Array of information about follows
 * @apiSuccess (200) {String} limit Limit for data size
 * @apiSuccess (200) {String} offset Offset for data size
 * @apiSuccess (200) {String} total Total size of followers list
 * @apiSuccess (204) 204 User has no follows
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 User not found
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 * @param next
 */
var getUserFollows = getUserChildCollection('follows', foreignUserToData);
/**
 * @api {get} /api/users/:search/search Search users
 * @apiDescription Return list at max 10 users that countains :search in their logins
 * @apiGroup User
 * @apiVersion 0.1.0
 * @apiParam {String} :search Substring of login
 * @apiSuccess (200) Array of users list. Empty if no users found
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 500 Error
 * @param req
 * @param res
 * @param next
 */
function searchUsers(req, res, next) {
    var search = req.params.search.trim();
    User.search(search).limit(10).exec()
    .then((users) => {
        if ((!users) || users.length === 0) {
            res.json([]);
        } else {
            res.json(users.map(foreignUserToData));
        }
    }).catch(next);
}

function loadUsersToObj(users) {

    return User.find({_id: {$in: Object.keys(users)}}).exec()
        .then((authors) => {
            authors.forEach(u => {
                users[u._id] = userToData(u);
            });
            return users;
        });
}

Object.assign(module.exports, {
    foreignUserToData,
    userToData,
    loadUsersToObj,
    getUserProfile,
    getUserByLogin,
    getUserFollowers,
    getUserFollows,
    searchUsers
});
