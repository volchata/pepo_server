var httpMocks = require('node-mocks-http');
var tweetAPI = require('../controllers/tweetAPI');
var User = require('../models/user').User;
var Tweet = require('../models/tweet').Tweet;
var assert = require('chai').assert;
var when = require('when');

function clearUsers() {
    User.find({provider: 'testprovider'}).remove().exec();
}

function clearTweets() {
    return User.find({provider: 'testprovider'}).exec((err, users) => {
        var usersId = users.map(user => user._id);
        Tweet.find({author: {$in: usersId}}).remove().exec();
    });
}

function createRequest(data, user) {
    var request = httpMocks.createRequest(data);
    request.user = user;
    return request;
}

function createResponse() {
    var response = httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
    });
    response.req = {};
    return response;
}

describe('Tweet controller unit test', function () {
    var user1,
        Json1 = {
            provider: 'testprovider',
            socialNetworkId: 1,
            notRegistered: false,
            displayName: 'testprovider_1'
        },
        user2,
        Json2 = {
            provider: 'testprovider',
            socialNetworkId: 2,
            notRegistered: false,
            displayName: 'testprovider_2'
        },
        parentTweet,
        Json3 = {
            'content': 'parentTweet'
        };

    before(function () {
        return clearTweets().
            then(clearUsers).
            then(result => {
                user1 = new User(Json1);
                user2 = new User(Json2);
                return when.all([user1.save(), user2.save()]);
            });
    });

    it('set tweet', function (done) {
        var data = {
            method: 'POST',
            url: '/user/feed',
            body: {
                content: 'van1'
            }
        };

        var request = createRequest(data, user1);
        var response = createResponse();

        tweetAPI.setTweet(request, response, function (err) {
            console.log(err);
            assert(false, 'Next called');
        });

        response.on('end', function () {
            var data = JSON.parse(response._getData());
            var tweet = data.tweets[0];
            assert.equal(response.statusCode, 200);
            assert.equal(tweet.content, 'van1');
            assert.equal(tweet.like, false);
            assert.equal(tweet.retweet, false);

            assert.isArray(tweet.extras.likes);
            assert.isArray(tweet.extras.comments);
            assert.isArray(tweet.extras.retweets);
            assert.lengthOf(tweet.extras.likes, 0);
            assert.lengthOf(tweet.extras.comments, 0);
            assert.lengthOf(tweet.extras.retweets, 0);
            done();
        });

    });

    it('comment tweet', function (done) {
        var parentTweet = new Tweet({
            author: user1._id,
            content: "parent tweet"
        });

        parentTweet.save(function (err) {

            if (err) {
                return console.log(err);
            }

            var data = {
                method: 'POST',
                url: '/tweet/'+ parentTweet._id,
                body: {
                    content: 'comment 1'
                },
                params: {
                  id: parentTweet._id
                }
            };

            var request = createRequest(data, user1);
            var response = createResponse();

            response.on('end', function () {
               var data = JSON.parse(response._getData());
               assert.equal(response.statusCode, 200);
               var tweet = data.tweets[0];
               assert.equal(tweet.content, 'comment 1');
               assert.equal(tweet.like, false);
               assert.equal(tweet.retweet, false);
               assert.equal(tweet.extras.commentedTweetId, parentTweet._id);

               assert.isArray(tweet.extras.likes);
               assert.isArray(tweet.extras.comments);
               assert.isArray(tweet.extras.retweets);
               assert.lengthOf(tweet.extras.likes, 0);
               assert.lengthOf(tweet.extras.comments, 0);
               assert.lengthOf(tweet.extras.retweets, 0);
               done();
           });

           tweetAPI.commentTweet(request, response, function (err) {
               console.log(err);
               assert(false, 'Next called');
               done();
           });
        });
    });

    describe('reTweet', function () {
        it('reTweet tweet if not retweeted yet', function (done) {
            var tweet = new Tweet({
                author: user1._id,
                content: "parent tweet"
            });

            tweet.save(function (err) {

                if (err) {
                    return console.log(err);
                }

                var data = {
                    method: 'POST',
                    url: '/tweet/'+ tweet._id +'/retweet',
                    body: {
                        content: 'it is retweet'
                    },
                    params: {
                      id: tweet._id
                    }
                };

                var request = createRequest(data, user1);
                var response = createResponse();

                response.on('end', function () {
                   var data = JSON.parse(response._getData());
                   assert.equal(response.statusCode, 200);
                   var tweet = data.tweets[0];
                   assert.equal(tweet.content, 'parent tweet');
                   assert.equal(tweet.like, false);
                   assert.equal(tweet.retweet, true);

                   assert.isArray(tweet.extras.likes);
                   assert.isArray(tweet.extras.comments);
                   assert.isArray(tweet.extras.retweets);
                   assert.lengthOf(tweet.extras.likes, 0);
                   assert.lengthOf(tweet.extras.comments, 0);
                   assert.lengthOf(tweet.extras.retweets, 1);
                   done();
               });

               tweetAPI.reTweet(request, response, function (err) {
                   console.log(err);
                   assert(false, 'Next called');
                   done();
               });
            });
        });

        it('reTweet tweet if alredy retweeted', function (done) {
            var tweet = new Tweet({
                author: user1._id,
                content: "parent tweet",
                'extras.retweets': [user1._id],
                retweet: true
            });

            tweet.save(function (err) {

                if (err) {
                    return console.log(err);
                }

                var data = {
                    method: 'POST',
                    url: '/tweet/'+ tweet._id +'/retweet',
                    body: {
                        content: 'it is retweet'
                    },
                    params: {
                      id: tweet._id
                    }
                };

                var request = createRequest(data, user1);
                var response = createResponse();

                response.on('end', function () {
                    var data = JSON.parse(response._getData());
                    assert.equal(response.statusCode, 200);
                    assert.equal(data.status, 'Already retweeted');
                    done();
               });

               tweetAPI.reTweet(request, response, function (err) {
                   console.log(err);
                   assert(false, 'Next called');
                   done();
               });
            });
        });

        it('reTweet tweet with wrong tweetID in params', function (done) {

                var data = {
                    method: 'POST',
                    url: '/tweet/57d5854473e1/retweet',
                    body: {
                        content: 'it is retweet'
                    },
                    params: {
                      id: '57d5854473e1'
                    }
                };

                var request = createRequest(data, user1);
                var response = createResponse();

                response.on('end', function () {
                    var data = JSON.parse(response._getData());
                    assert.equal(response.statusCode, 404);
                    assert.equal(data.status, 'Tweet not found');
                    done();
               });

               tweetAPI.reTweet(request, response, function (err) {
                   console.log(err);
                   assert(false, 'Next called');
                   done();
               });
        });
    });

    describe('get comments', function () {
        it('get 10 comments(request without limit and offset)', function (done) {
            var commentedTweet = new Tweet({
                author: user1._id,
                content: 'parent tweet'
            });

            commentedTweet.save(function (err) {
                if(err) console.log(err);

                createTweets(user1, {content: 'comment', commentedTweetId: commentedTweet._id}, 15)
                    .then(resurt => {
                        resurt.forEach(function(tw) {
                           commentedTweet.extras.comments.push(tw._id); 
                        });

                        commentedTweet.save()
                            .then( function() {                                  
                                var req = {
                                    method: 'GET',
                                    url: '/api/tweet/' + commentedTweet._id + '/comments',
                                    body: {
                                        content: 'it is comment'
                                    },
                                    params: {
                                        id: commentedTweet._id
                                    }
                                };

                                var request = createRequest(req, user1);
                                var response = createResponse();

                                response.on('end', function () {

                                    var data = JSON.parse(response._getData());
                                    var tweets = data.tweets;
                                    var tweet = data.tweets[0];

                                    assert.equal(response.statusCode, 200);
                                    assert.equal(tweet.extras.commentedTweetId, commentedTweet._id);

                                    assert.isArray(commentedTweet.extras.comments);
                                    assert.lengthOf(commentedTweet.extras.comments, 15);
                                    assert.lengthOf(tweets, 10);
                                    done();
                                });

                                tweetAPI.getComments(request, response, function (err) {
                                    console.log(err);
                                    assert(false, 'Next called');
                                    done();
                                });
                            });
                    });
            });
        });

        // it('get 10 comments(request with offset and limit=55)', function (done) {
        //     var commentedTweet = new Tweet({
        //         author: user1._id,
        //         content: 'parent tweet'
        //     });

        //     commentedTweet.save(function (err) {
        //         if(err) console.log(err);

        //         createTweets(user1, {content: 'comment', commentedTweetId: commentedTweet._id}, 65)
        //             .then(resurt => {
        //                 resurt.forEach(function(tw) {
        //                    commentedTweet.extras.comments.push(tw._id); 
        //                 });
        //                 commentedTweet.save()
        //                     .then( () => {
        //                         var offset = resurt[5].timestamp;
        //                         var req = {
        //                             method: 'GET',
        //                             url: '/api/tweet/' + commentedTweet._id + '/comments?limit=55&offset=' + offset,
        //                             body: {
        //                                 content: 'it is comment'
        //                             },
        //                             params: {
        //                                 id: commentedTweet._id
        //                             },
        //                             query: {
        //                                 offset: offset,
        //                                 limit: 55
        //                             }
        //                         };

        //                         var request = createRequest(req, user1);
        //                         var response = createResponse();

        //                         response.on('end', function () {

        //                             var data = JSON.parse(response._getData());
        //                             var tweets = data.tweets;

        //                             assert.equal(response.statusCode, 200);

        //                             assert.isArray(commentedTweet.extras.comments);
        //                             assert.lengthOf(commentedTweet.extras.comments, 65);
        //                             assert.lengthOf(tweets, 50);
        //                             done();     
        //                         });

        //                         tweetAPI.getComments(request, response, function (err) {
        //                             console.log(err);
        //                             assert(false, 'Next called');
        //                             done();
        //                         });
        //                     });
        //             });
        //     });
        // });
    });

    it('get tweet with 10 comments', function (done) {
        var commentedTweet = new Tweet({
            author: user1._id,
            content: 'parent tweet'
        });

        commentedTweet.save(function (err) {
            if(err) console.log(err);

            createTweets(user1, {content: 'comment', commentedTweetId: commentedTweet._id}, 15)
                .then(resurt => {
                    resurt.forEach(function(tw) {
                       commentedTweet.extras.comments.push(tw._id); 
                    });
                    commentedTweet.save()
                        .then( () => {
                            var req = {
                                method: 'GET',
                                url: '/api/tweet/' + commentedTweet._id,
                                params: {
                                    id: commentedTweet._id
                                }
                            };

                            var request = createRequest(req, user1);
                            var response = createResponse();

                            response.on('end', function () {

                                var data = JSON.parse(response._getData());
                                var tweet = data.tweets[0];

                                assert.equal(response.statusCode, 200);

                                assert.isArray(commentedTweet.extras.comments);
                                done();
                            });

                            tweetAPI.getTweet(request, response, function (err) {
                                console.log(err);
                                assert(false, 'Next called');
                                done();
                            });
                        });
                });
        });
    });

    describe('get tweets', function () {
        it('get own tweets (without limit and affset)', function (done) {
            createTweets(user1, {content: 'tweet'}, 15)
                .then( result => {
                    var authorsId = result.map(tw => tw.author);
                    authorsId = [ ...new Set(authorsId) ];

                    var req = {
                        method: 'GET',
                        url: '/user/feed'
                    };

                    var request = createRequest(req, user1);
                    var response = createResponse();

                    response.on('end', function () {

                        var data = JSON.parse(response._getData());
                        var tweets = data.tweets;
                        var usersId = Object.keys(data.users);

                        assert.equal(response.statusCode, 200);
                        assert.equal(authorsId.length, usersId.length);

                        authorsId.forEach(athr => {
                            var p = usersId.includes(athr.toString());
                            assert.isTrue(p);
                        });
                        assert.lengthOf(tweets, 10);
                        done();     
                    });

                    tweetAPI.getTweets(request, response, function (err) {
                        console.log(err);
                        assert(false, 'Next called');
                        done();
                    });
                });
        });

        it('get own tweets (with limit 55)', function (done) {
            createTweets(user1, {content: 'tweet'}, 60)
                .then( result => {
                    var authorsId = result.map(tw => tw.author);
                    authorsId = [ ...new Set(authorsId) ];

                    var req = {
                        method: 'GET',
                        url: '/user/feed?limit=55',
                        query: {
                            limit: 55
                        }
                    };

                    var request = createRequest(req, user1);
                    var response = createResponse();

                    response.on('end', function () {

                        var data = JSON.parse(response._getData());
                        var tweets = data.tweets;
                        var usersId = Object.keys(data.users);

                        assert.equal(response.statusCode, 200);
                        assert.equal(authorsId.length, usersId.length);

                        authorsId.forEach(athr => {
                            var p = usersId.includes(athr.toString());
                            assert.isTrue(p);
                        });
                        assert.lengthOf(tweets, 50);
                        done();     
                    });

                    tweetAPI.getTweets(request, response, function (err) {
                        console.log(err);
                        assert(false, 'Next called');
                        done();
                    });
                });
        });
    });
});

function createTweets(user, data, amount) {
    var tweets = [];
    for (var i = 0; i < amount; i++) {
        var tweet = new Tweet({
            author: user._id,
            content: data.content + i,
            'extras.commentedTweetId': data.commentedTweetId
        });
        tweets.push(tweet);
    }

    return when.map(tweets, tweet => {
        return tweet.save();
    });
}
