'use strict';

var Tweet = require('../models/tweet').Tweet;
var User = require('../models/user').User;

function setTweet(req, res, next) {

    User.findOne({login: req.params.login}, (err, user) => {
        if (err) {
            return next(err);
        }

        if (!user) {
            return res.status(404).send({status: 'User not found'});
        }

        var tweet = new Tweet({
            author: user._id,
            content: req.body.content,
            extras: {
                prevTweetId: req.body.tweet,
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
    if (req.query.offset) {
        User.findOne({login: req.params.login})
        .exec((err, user) => {
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(404).send({status: 'User not found'});
            }

            Tweet.find({
                $and: [
                    {author: user._id},
                    {timestamp: {$gte: req.query.offset}}
                ]
            })
            .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
            .sort({timestamp: -1})
            .exec((err, tweets) => {
                res.status(200).send({status: 'OK', tweets});
            });
        });

    } else {
        User.findOne({login: req.params.login})
        .exec((err, user) => {
            console.log('user', user);
            if (err) {
                return next(err);
            }

            if (!user) {
                return res.status(404).send({status: 'User not found'});
            }

            Tweet.find({author: user._id})
                .limit(req.query.limit > 50 ? 50 : ((Number(req.query.limit) || 10)))
                .sort({timestamp: -1})
                .exec((err, tweets) => {
                    res.status(200).send({status: 'OK', tweets});
                });
        });
    }
}

module.exports = {
    getTweets,
    setTweet
};
