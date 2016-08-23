'use strict';

var Tweet = require('../models/tweet').Tweet;
var User = require('../models/user').User;
var mongoose = require('mongoose');

function setTweet(req, res, next) {
    console.log('USER', req.params.login);
    User.findOne({displayName: req.params.login}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        var tweet = new Tweet({
            author: user._id,
            content: req.body.content,
            extras: {
                parentTweetId: req.body.tweet,
                image: req.body.image,
                url: req.body.url,
                geo: req.body.geo
            }
        });

        tweet.save(function (err) {
            if (err) {
                return next(err);
            } else {
                return res.status(200).send({status: 'OK', tweet: tweet});
            }
        });
    });
}

function reTweet(req, res, next) {
    var parentTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(parentTweetId)) {
        return res.status(404).send({status: 'Tweet not found'});
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
                return res.status(200).send({status: 'OK', tweet: tweet});
            }
        });
    });
}

function commentTweet(req, res, next) {
    var commentedTweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(commentedTweetId)) {
        return res.status(404).send({status: 'Tweet not found'});
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
                return res.status(200).send({status: 'OK', tweet: tweet});
            }
        });

        Tweet.findById(commentedTweetId)
        .exec((err, commentedTweet) => {
            if (err) {
                return next(err);
            }

            commentedTweet.extras.comments.push(tweet._id);
            commentedTweet.save(function (err) {
                console.log('commentedTweet', commentedTweet);
                if (err) {
                    return next(err);
                }
            });
        });
    });
}

function getTweets(req, res, next) {
    User.findOne({displayName: req.params.login})
        .populate('folowers')
        .exec((err, user) => {
            if (!User.isUser(req, res, err, user, next)) {
                return;
            }

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
                        res.status(200).send({status: 'OK', tweets});
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
                        res.status(200).send({status: 'OK', tweets});
                    }
                });
            }
        });
}

function getTweet(req, res, next) {
    var tweetId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        return res.status(404).send({status: 'Tweet not found'});
    }

    Tweet.findOne({_id: tweetId})
    .populate('extras.parentTweetId extras.comments')
    .exec((err, tweet) => {
        console.log('tweet', tweet);
        if (err) {
            return next(err);
        } else {
            res.status(200).send({status: 'OK', tweet});
        }
    });
}

module.exports = {
    setTweet,
    reTweet,
    commentTweet,
    getTweets,
    getTweet
};
