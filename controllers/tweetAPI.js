'use strict';

var Tweet = require('../models/tweet').Tweet;
var User = require('../models/user').User;
var mongoose = require('mongoose');

function setTweet(req, res, next) {

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

function retweet(req, res, next) {
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
    });
}

function getTweets(req, res, next) {
    User.findOne({displayName: req.params.login})
        .exec((err, user) => {
            if (!User.isUser(req, res, err, user, next)) {
                return;
            }

            if (req.query.offset) {
                Tweet.find({
                    $and: [
                        {author: user._id},
                        {timestamp: {$gte: req.query.offset}}
                    ]
                })
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    res.status(200).send({status: 'OK', tweets});
                });
            } else {
                Tweet.find({author: user._id})
                .sort({timestamp: -1})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .exec((err, tweets) => {
                    res.status(200).send({status: 'OK', tweets});
                });
            }
        });
}

module.exports = {
    getTweets,
    setTweet,
    retweet,
    commentTweet
};
