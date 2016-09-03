'use strict';
var userToData = require('./user.js').userToData;
var User = require('../models/user').User;
var Tweet = require('../models/tweet').Tweet;

var foreignUserFields = {
    displayName: 1,
    avatar: 1,
    firstName: 1,
    lastName: 1,
    _id: 0};
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
 * @apiSuccess (200) {Boolean} followed Set if user is followed by current user
 * @apiSuccess (200) {Boolean} notRegistered Set if user does not send initial profile update after social login
 * @apiSuccess (200) {Number} followers Number of user's followers
 * @apiSuccess (200) {Number} follows Number of persons that user follows
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
            User.findOne({_id: req.user._id}, function (err, cuser) {
                Tweet.find({
                    $and: [
                        {author: user._id},
                        {'extras.commentedTweetId': {$exists: false}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(10)
                .exec((err, tweets) => {
                    if (err) {
                        console.log('err', err);
                        return next(err);
                    } else {
                        parseTweet(tweets, next, (o) => {
                            res.status(200).json(o);
                        }, user);
                    }
                });
            });
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
    User.search(search).limit(10).exec(
        function (err, users) {
            if (err) {
                next(err);
            } else if ((!users) || users.length === 0) {
                res.json([]);
            } else {
                res.json(users.map(foreignUserToData));
            }}
    );
}

function parseTweet(tweets, next, cb, user) {

    var users = {};
    if (!(tweets instanceof Array)) {
        tweets = [tweets];
    }

    tweets = tweets.map(x => {
        var isLiked;
        var isRetweeted;
        var tweet = x.toJSON();
        users[tweet.author] = null;

        if (user && tweet.extras) {
            if (tweet.extras.likes) {
                isLiked = tweet.extras.likes.some(x => x.toString() === user._id.toString());
            }
            if (tweet.extras.retweets) {
                isRetweeted = tweet.extras.retweets.some(x => (x.toString() === user._id.toString()) );
            }

            tweet.like = isLiked;
            tweet.retweet = isRetweeted;
        } else {
            if (!(tweet.extras)) {
                tweet.extras = {};
            }
        }

        return tweet;
    });

    User.find({_id: {$in: Object.keys(users)}})
        .exec((err, authors) => {
            if (err) {
                return next(err);
            }

            authors.forEach(u => {
                users[u._id] = userToData(u);
            });

            cb( {tweets: tweets, users: users} );
        });
}

module.exports = {
    foreignUserToData,
    getUserByLogin,
    getUserFollowers,
    getUserFollows,
    searchUsers
};
