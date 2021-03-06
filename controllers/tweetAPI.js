'use strict';

var mongoose = require('mongoose');
var Tweet = require('../models/tweet').Tweet;
var User = require('../models/user').User;
var images = require('./images');
var users = require('./users');

var Encoder = (new (require('node-html-encoder').Encoder)('entity'));
var encode = ( Encoder.htmlEncode.bind(Encoder) );
var filterGeo = require('../libs/utils').filterGeo;

function prefixOuterURL(url) {
    var re = /^https?:\/\//;
    if (!(re.test(url))) {
        url = 'http://' + url;
    }
    return url; //encodeURI(url);
}

function createTwit(user, base, cb ) {
    var b = {
        author: user._id,
        content: encode(base.content),
        extras: { }
    };

    var t = ['commentedTweetId', 'geo', 'url', 'parentTweetId', 'image', 'attachment'];
    /*eslint-disable-next-line no-unexpected-multiline,no-sequences */
    t.forEach((item) => {
        if (base[item]) {
            b.extras[item] = base[item];
        } else if (base.extras && base.extras[item]) {
            b.extras[item] = base.extras[item];
        }

    });

    if (b.extras.url) {
        b.extras.url = prefixOuterURL(b.extras.url);
    }

    if (b.extras.image) {
        images.commitFile(b.extras.image, (err)=>{
            if (!err) {
                console.log('Error while commiting image:', err);
            }
        });
    }
    if (b.extras.attachment) {
        images.commitFile(b.extras.attachment, (err, att)=>{
            if ((att) && (!err)) {
                b.extras.attachment = {
                    url: att.target,
                    image: att.url,
                    title: att.title
                };
                cb(null, new Tweet(b));
            } else {
                if (!err) {
                    err = 'Attachment not found';
                }
                cb(err);
            }
        });
    } else {
        setImmediate( () => {
            cb(null, new Tweet(b));
        });
    }

}

function setTweet(req, res, next) {
    if (req.body.extras && req.body.extras.geo) {
        req.body.extras.geo = filterGeo(req.body.extras.geo);
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        createTwit(user, req.body, (err1, tweet) => {
            if (err1) {
                return next(err1);
            }
            tweet.save(function (err) {
                if (err) {
                    return next(err);
                } else {

                    return ParseTweetsAndSend(res, tweet, user, next);
                }
            });
        });

    });
}

function reTweet(req, res, next) {
    var parentTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parentTweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    if (req.body.extras && req.body.extras.geo) {
        req.body.extras.geo = filterGeo(req.body.extras.geo);
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {

        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        Tweet.findById(parentTweetId)
            .exec((err, parentTweet) => {
                if (err) {
                    return next(err);
                }

                if (!parentTweet) {
                    return res.status(404).json({status: 'Tweet not found'});
                }

                var isRetweet = parentTweet.extras.retweets.some(x => x.toString() === user._id.toString());

                if (!isRetweet) {
                    req.body.parentTweetId = parentTweetId;
                    req.body.content = parentTweet.content;

                    createTwit(user, req.body, (err1, tweet) => {
                        if (err1) {
                            return next(err1);
                        }

                        tweet.save(function (err) {
                            if (err) {
                                console.log('Error while saving tweet: ', err);
                            }
                        });
                    });

                    parentTweet.extras.retweets.push(user._id);
                    parentTweet.save()
                    .then( () => {
                        return Tweet.find({_id: parentTweetId}).exec();
                    })
                    .then((newTweet) => {
                        return ParseTweetsAndSend(res, newTweet, user, next);
                    });
                } else {
                    res.status(200).json({status: 'Already retweeted'});
                }
            });
    });
}

function commentTweet(req, res, next) {
    var commentedTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentedTweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    if (req.body.extras && req.body.extras.geo) {
        req.body.extras.geo = filterGeo(req.body.extras.geo);
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        Tweet.findById(commentedTweetId)
        .exec((err, commentedTweet) => {
            if (err) {
                return next(err);
            }

            if (!commentedTweet) {
                return res.status(404).json({status: 'Tweet not found'});
            }

            req.body.commentedTweetId = commentedTweetId;

            createTwit(user, req.body, (err1, tweet) => {
                if (err1) {
                    return next(err1);
                }

                tweet.save(function (err) {
                    if (err) {
                        return next(err);
                    } else {
                        return ParseTweetsAndSend(res, tweet, user, next);
                    }
                });

                commentedTweet.extras.comments.push(tweet._id);
                commentedTweet.save(function (err) {
                    if (err) {
                        return next(err);
                    }
                });
            });
        });
    });
}

function getComments(req, res, next) {
    var commentedTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentedTweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    Tweet.findById(commentedTweetId)
        .exec((err, commentedTweet) => {
            if (err) {
                return next(err);
            }

            if (!commentedTweet) {
                return res.status(404).json({status: 'Tweet not found'});
            }

            var comments = commentedTweet.extras.comments;

            if (req.query.offset) {
                Tweet.find({
                    $and: [
                        {_id: {$in: comments}},
                        {'extras.commentedTweetId': {$exists: true}},
                        {timestamp: {$gt: req.query.offset}}
                    ]
                })
                .sort({timestamp: 0})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        return ParseTweetsAndSend(res, tweets, null, next);
                    }
                });
            } else {
                Tweet.find({
                    $and: [
                        {_id: {$in: comments}},
                        {'extras.commentedTweetId': {$exists: true}}
                    ]
                })
                .sort({timestamp: 1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {

                    if (err) {
                        return next(err);
                    } else {
                        return ParseTweetsAndSend(res, tweets, null, next);
                    }
                });
            }

        });
}

function getTweets(req, res, next) {
    if (!req.params.login) {
        User.getByReq(req, res, next, (q)=>{
            q.populate('follows');
        }).then((user) => {
            var userFollows = user.follows.map(follower => follower._id);
            userFollows.push(user._id);

            if (req.query.offset) {
                Tweet.find({
                    $and: [
                        {author: {$in: userFollows}},
                        {'extras.commentedTweetId': {$exists: false}},
                        {timestamp: {$gte: req.query.offset}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        parseTweet(tweets, user).then((o) => {
                            if (req.geoip) {
                                o.geoIp = {ll: req.geoip.ll};
                            }
                            res.status(200).json(o);
                        });
                    }
                });
            } else {
                Tweet.find({
                    $and: [
                        {author: {$in: userFollows}},
                        {'extras.commentedTweetId': {$exists: false}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        parseTweet(tweets, user).then((o) => {
                            if (req.geoip) {
                                o.geoIp = {ll: req.geoip.ll};
                            }
                            res.status(200).json(o);
                        });
                    }
                });
            }
        });
    } else if (req.params.login) {
        User.findOne({displayName: req.params.login})
            .exec((err, user) => {
                Tweet.find({
                    $and: [
                        {author: user._id},
                        {'extras.commentedTweetId': {$exists: false}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(50)
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        parseTweet(tweets, next, (o) => {
                            if (req.geoip) {
                                o.geoIp = {ll: req.geoip.ll};
                            }
                            res.status(200).json(o);
                        }, user);
                    }
                });
            });
    } else {
        res.status(200).json({status: 'error'});
    }
}

function getHistory(req, res, next) {
    if (!req.params.login) {
        User.getByReq(req, res, next, (q)=>{
            q.populate('follows');
        }).then((user) => {
            var userFollows = user.follows.map(follower => follower._id);
            userFollows.push(user._id);

            if (req.query.offset) {
                Tweet.find({
                    $and: [
                    {author: {$in: userFollows}},
                    {'extras.commentedTweetId': {$exists: false}},
                    {timestamp: {$lt: req.query.offset}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        return ParseTweetsAndSend(res, tweets, user, next);
                    }
                });
            } else {
                Tweet.find({
                    $and: [
                    {author: {$in: userFollows}},
                    {'extras.commentedTweetId': {$exists: false}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        return ParseTweetsAndSend(res, tweets, user, next);
                    }
                });Tweet.PopularImages().limit(10).exec().then(res=>{
                    console.log(res);
                });
            }
        });
    }
}
/**
 * @api {get} /api/topimage Get random top image
 * @apiGroup Tweet
 * @apiName getRandomTopImage
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} _id Tweet id.
 * @apiSuccess (200) {Object} extras
 * @apiSuccess (200) {String} extras\.image Url of image.
 * @apiSuccess (200) {Number} imlikes Number of likes of image
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 404 Tweet not found
 * @param req
 * @param res
 */
function getRandomTopImage(req, res) {
    Tweet.PopularImages().limit(10).exec().then(result=>{
        var max = Math.min(result.length, 10);
        if (max === 0) {
            res.status(404).json({status: 'Tweet not found'});
        } else {
            console.log(res[Math.floor(Math.random() * max)]);
            res.status(200).json(result[Math.floor(Math.random() * max)]);
        }
    });
}

function getNearTweets(req, res, next) {
    console.log(req);
    if (!req.geoip) {
        res.send([]);

    }

    var limit = req.params.limit || 50;
    var offset = req.params.offset || 0;
    var center = [req.geoip.ll[1], req.geoip.ll[0]];
    Tweet.byDistance(center).skip(offset).limit(limit).exec().then(function (tweets) {
        parseTweet(tweets, req.user)
            .then((o) => {
                if (req.geoip) {
                    o.geoIp = {ll: req.geoip.ll};
                }
                res.status(200).json(o);
            }).catch(next);

    });

}

function getTweet(req, res, next) {
    var tweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }
    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]
    })
        .exec((err, user) => {
            Tweet.findOne({_id: tweetId})
            .where('extras.comments').slice(10)
            .populate('extras.parentTweetId extras.comments')
            .exec((err, tweet) => {
                if (err) {
                    return next(err);
                }

                if (!tweet) {
                    return res.status(404).json({status: 'Tweet not found'});
                }

                var cUserIds = [];
                var cTweets = [];
                for (var i = 0; i < tweet.extras.comments.length; i++) {
                    var comment = tweet.extras.comments[i];

                    var commentAuthorId = comment.author;
                    if (cUserIds.indexOf(mongoose.Types.ObjectId(commentAuthorId)) === -1) {
                        cUserIds[cUserIds.length] = mongoose.Types.ObjectId(commentAuthorId);
                    }

                    cTweets[cTweets.length] = comment;

                }

                var cUsers = {};
                if (cUserIds.length) {
                    User.find({
                        _id: {$in: cUserIds}
                    }).exec()
                        .then(function (item) {

                            cUsers[item[0]._id] = item[0];

                            var comments = {tweets: cTweets, users: cUsers};

                            return ParseTweetsAndSend(res, tweet, user, next, comments);
                        });

                } else {
                    return ParseTweetsAndSend(res, tweet, user, next);
                }

                //

            });
        });
}

function likeTweet(req, res, next) {
    var likeTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(likeTweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        Tweet.findById(likeTweetId)
            .exec((err, tweet) => {
                if (err) {
                    return next(err);
                }

                if (!tweet) {
                    return res.status(404).json({status: 'Tweet not found'});
                }

                var index = tweet.extras.likes.indexOf(user._id);

                if (req.method === 'POST' && (index === -1)) {
                    tweet.extras.likes.push(user._id);

                    tweet.save(function (err) {
                        if (err) {
                            return next(err);
                        }

                        return ParseTweetsAndSend(res, tweet, user, next);

                    });
                } else if (req.method === 'DELETE' && !(index === -1)) {
                    tweet.extras.likes.splice(index, 1);
                    tweet.save(function (err) {
                        if (err) {
                            return next(err);
                        }

                        return ParseTweetsAndSend(res, tweet, user, next);
                    });
                } else {
                    return ParseTweetsAndSend(res, tweet, user, next);
                }

            });
    });
}

function deleteTweet(req, res, next) {
    var deleteTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(deleteTweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        Tweet.findByIdAndRemove(deleteTweetId)
            .where('author', user._id)
            .exec((err, tweet) => {
                if (!tweet) {
                    return res.status(404).json({status: 'Tweet not found'});
                }
                var comments = tweet.extras.comments;

                Tweet.find({_id: {$in: comments}})
                    .remove()
                    .exec((err) => {
                        if (err) {
                            return next(err);
                        }
                        return ParseTweetsAndSend(res, tweet, user, next);
                    });
            });
    });
}

function deleteReTweet(req, res, next) {
    var tweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {

        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        Tweet.findById(tweetId)
            .exec((err, parentTweet) => {
                if (err) {
                    return next(err);
                }

                if (!parentTweet) {
                    return res.status(404).json({status: 'Tweet not found'});
                }

                Tweet.find({
                    $and: [
                        {author: user._id},
                        {'extras.parentTweetId': tweetId}
                    ]})
                    .remove()
                    .exec((err) => {
                        if (err) {
                            return next(err);
                        }

                        var index = parentTweet.extras.retweets.indexOf(user._id);

                        if (index !== -1) {
                            parentTweet.extras.retweets.splice(index, 1);
                            parentTweet.save(function (err) {
                                if (err) {
                                    return next(err);
                                }

                                return ParseTweetsAndSend(res, parentTweet, user, next);
                            });
                        } else {
                            return ParseTweetsAndSend(res, parentTweet, user, next);
                        }

                    });
            });
    });
}

function tweetsToJson(tweets, user, users) {
    users = users || {};
    if (!(tweets instanceof Array)) {
        tweets = [tweets];
    }
    tweets = tweets.map(x => {
        var isLiked;
        var isRetweeted;
        var isOwner;
        var tweet = x.toJSON();
        if (users[tweet.author] === undefined) {
            users[tweet.author] = null;
        }
        if (user && tweet.extras) {
            if (tweet.extras.likes) {
                isLiked = tweet.extras.likes.some(x => x.toString() === user._id.toString());
            }
            if (tweet.extras.retweets) {
                isRetweeted = tweet.extras.retweets.some(x => (x.toString() === user._id.toString()));
            }

            if (user.owner !== undefined) {
                isOwner = user.owner;
            } else {
                isOwner = (tweet.author.toString() === user._id.toString());
            }

            tweet.like = isLiked;
            tweet.retweet = isRetweeted;
            tweet.owner = isOwner;
        } else {
            if (!(tweet.extras)) {
                tweet.extras = {};
            }
        }

        return tweet;
    });
    return {
        tweets,
        users
    };
}

function parseTweet(tweets, user) {
    var obj = tweetsToJson(tweets, user);

    return users.loadUsersToObj(obj.users).then(function () {
        return obj;
    });
}

function ParseTweetsAndSend(res, tws, user, next, comments) {
    if (user == null) {   // eslint-disable-line no-eq-null,eqeqeq
        user = res.req.user;
    }
    return parseTweet(tws, user, comments)
    .then((o) => {
        if (comments) {
            o.tweets[0].extras.comments = comments;
        }
        if (res.req.geoip) {
            o.geoIp = {ll: res.req.geoip.ll};
        }
        res.status(200).json(o);
    }).catch(next);
}

module.exports = {
    setTweet,
    reTweet,
    commentTweet,
    getComments,
    getTweets,
    getHistory,
    getTweet,
    likeTweet,
    deleteTweet,
    deleteReTweet,
    parseTweet,
    tweetsToJson,
    getRandomTopImage,
    getNearTweets
};
