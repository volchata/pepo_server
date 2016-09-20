'use strict';

var User = require('../models/user').User;
var Interest = require('../models/interest').Interest;
var when = require('when');

function postInterest(req, res, next) {
    User.findOne({
    $and: [
        {socialNetworkId: req.user.socialNetworkId},
        {provider: req.user.provider}
    ]}, (err, user) => {
        if (!User.isUser(req, res, err, user, next)) {
            return;
        }

        var userInterests = req.body.interests;;

        Interest.find({title: {$in: userInterests}})
            .exec((err, dbInterests) => {
                if(userInterests.length === dbInterests.length){
                    saveUserInterests(user, dbInterests)
                        .then(function () {
                            res.status(200).json(user);
                        })
                        .catch(next);
                }else {
                    var titles = dbInterests.map(interest => interest.title);
                    var newInterests = userInterests.map(intr => {
                        if(titles.indexOf(intr) < 0){
                            return intr;
                        }
                    });
                    saveNewInterests(newInterests)
                        .then(function (result) {
                            result = dbInterests.concat(result);
                            saveUserInterests(user, result);
                        })
                        .then(function () {
                            res.status(200).json(user);
                        })
                        .catch(next);
                }
            });
    });
}

function getInterest(req, res, next) {
    Interest.find({})
        .exec((err, dbInterests) => {
            var titles = dbInterests.map(interest => interest.title);
            res.status(200).json({interests: titles});
        });
}

function saveNewInterests(interests) {
    var newInterests = [];

    interests.forEach(intr => {
        if(intr !== undefined){
            var interest = new Interest({
                title: intr
            });
            newInterests.push(interest);
        }

    });

    return when.map(newInterests, interest => {
        return interest.save();
    });
}

function saveUserInterests(user, interests){
    var interestIds = interests.map(interest => interest._id);

    interestIds.forEach((id) => {
        if(user.interests.indexOf(id) < 0){
            user.interests.push(id);
        }
    });

    return user.save();
}

module.exports = {
    postInterest,
    getInterest
};
