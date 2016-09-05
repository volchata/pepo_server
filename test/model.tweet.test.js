'use strict';

var User = require('../models/user').User;
var Tweet = require('../models/tweet').Tweet;
var assert = require('chai').assert;
var when = require('when');

function clear() {
    User.find({provider: 'testprovider'}).remove().exec();
}

describe('TweetAPI model unit test', function () {
    var user1;
    var Json1 = {
        provider: 'testprovider',
        socialNetworkId: 1000,
        notRegistered: false,
        displayName: 'testprovider_1000'
    };
    var user2;
    var Json2 = {
        provider: 'testprovider',
        socialNetworkId: 2000,
        notRegistered: false,
        displayName: 'testprovider_2000'
    };

    before(function () {
        clear();
        user1 = new User(Json1);
        user2 = new User(Json2);
        return when.all([user1.save(), user2.save()]);
    });

    it('test combined twits', function (done) {
        var tweet1 = new Tweet({
            author: user2,
            content: 'not need it'
        });

        var tweet2 = new Tweet({
            author: user2,
            content: 'like it',
            extras: {
                likes: [
                    user1._id
                ]
            }
        });

        var tweet3 = new Tweet({
            author: user1,
            content: 'image',
            extras: {
                image: 'some image'
            }
        });

        var tweet4 = new Tweet({
            author: user1,
            content: 'my'
        });
        when.all([
            tweet1.save(),
            tweet2.save(),
            tweet3.save(),
            tweet4.save()
        ]).then(function () {
            Tweet.userTweetsCombined(user1, 10).then(status=>{
                assert.lengthOf(status[0], 2);
                assert.lengthOf(status[1], 1);
                assert.equal(status[1][0].content, 'image');
                assert.lengthOf(status[2], 1);
                assert.equal(status[2][0].content, 'like it');
                done();
            });
        });

    });

    after(function (done) {
        //clear();
        done();
    });
});
