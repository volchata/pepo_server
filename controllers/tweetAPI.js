'use strict';

var Tweet = require('../models/tweet').Tweet;
var User = require('../models/user').User;
var mongoose = require('mongoose');

function setTweet(req, res, next) {
    User.findOne({
        $and: [
            {socialNetworkId: req.user.socialNetworkId},
            {provider: req.user.provider}
        ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        var tweet = new Tweet({
            author: user._id,
            content: req.body.content
        });

        tweet.save(function (err) {
            if (err) {
                return next(err);
            } else {
                console.log("tweetSET", tweet);
                return res.status(200).json({status: 'OK', tweet: tweet});
            }
        });
    });
}

function reTweet(req, res, next) {
    var parentTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parentTweetId)) {
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

        var tweet = new Tweet({
            author: user._id,
            content: req.body.content,
            extras: {
                parentTweetId: parentTweetId,
                image: req.body.image,
                url: req.body.url,
                geo: req.body.geo
            }
        });

        tweet.save(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.status(200).json({status: 'OK', tweet: tweet});
            }
        });
    });
}

function commentTweet(req, res, next) {
    var commentedTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentedTweetId)) {
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

        Tweet.findById(commentedTweetId)
        .exec((err, commentedTweet) => {
            if (err) {
                return next(err);
            }

            if (!commentedTweet) {
                return res.status(404).json({status: 'Tweet not found'});
            }

            var tweet = new Tweet({
                author: user._id,
                content: req.body.content,
                extras: {
                    commentedTweetId: commentedTweetId,
                    image: req.body.image,
                    url: req.body.url,
                    geo: req.body.geo
                }
            });

            tweet.save(function (err) {
                if (err) {
                    return next(err);
                } else {
                    return res.status(200).json({status: 'OK', tweet: tweet});
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
}

function getTweets(req, res, next) {
    if(!req.params.login){
        User.findOne({
            $and: [
                {socialNetworkId: req.user.socialNetworkId},
                {provider: req.user.provider}
            ]
        })
        .populate('folowers')
        .exec((err, user) => {
            if (!User.isUser(req, res, err, user, next)) {
                return;
            }
            console.log("user", user);
            var folowers = user.folowers.map(folower => folower._id);
            folowers.push(user._id);

            if (req.query.offset) {
                Tweet.find({
                    $and: [
                        {author: {$in: folowers}},
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
                        parseTweet(tweets, (o) => {
                            res.status(200).json(o);    
                        })                        
                    }
                });
            } else {
                Tweet.find({
                    $and: [
                        {author: {$in: folowers}},
                        {'extras.commentedTweetId': {$exists: false}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    if (err) {
                        return next(err);
                    } else {
                        parseTweet(tweets, (o) => {
                            res.status(200).json(o);    
                        })
                    }
                });
            }
        });
    }
}

function getTweet(req, res, next) {
    var tweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        return res.status(404).json({status: 'Tweet not found'});
    }

    Tweet.findOne({_id: tweetId})
    .populate('extras.parentTweetId extras.comments')
    .exec((err, tweet) => {
        if (err) {
            return next(err);
        } else {
            res.status(200).json({status: 'OK', tweet});
        }
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

                        if (req.query.like && (index === -1)) {
                            tweet.extras.likes.push(user._id);
                            tweet.save(function (err) {
                                if (err) {
                                    return next(err);
                                }

                                return res.status(200).json({like: true, likes: tweet.extras.likes.length});
                            });
                        } else if (!(index === -1)) {
                            tweet.extras.likes.splice(index, 1);
                            tweet.save(function (err) {
                                if (err) {
                                    return next(err);
                                }

                                return res.status(200).json({like: false, likes: tweet.extras.likes.length});
                            });
                        }

                        //res.status(200).json({like: false, likes: tweet.extras.likes.length});
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
                        if (err) {
                            return next(err);
                        }

                        if (!tweet) {
                            return res.status(404).json({status: 'Tweet not found'});
                        }

                        res.status(200).json(tweet);
                    });
    });
}


function parseTweet(tweets, cb){
    var users = {};
    tweets.forEach(t => { users[t.author] = null;} );
    console.log("users", Object.keys(users));

    User.find({_id: {$in: Object.keys(users)}})
            .exec((err, authors) => {
            if (err) {
                return next(err);
            }

            console.log("authors", authors);
            authors.forEach(u => {
                users[u._id] = u;
            })

            cb( {tweets: tweets, users: users} );
        });
}

module.exports = {
    setTweet,
    reTweet,
    commentTweet,
    getTweets,
    getTweet,
    likeTweet,
    deleteTweet
};
