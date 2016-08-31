'use strict';

var httpMocks = require('node-mocks-http');
var ctr = require('../controllers/user');
var User = require('../models/user').User;
var assert = require('assert');
var when = require('when');

function clear() {
    User.find({provider: 'testprovider'}).remove().exec();
}

function createRequest(data, user) {

    var request = httpMocks.createRequest(data);
    request.user = user;
    return request;
}
function createResponse() {
    return httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
    });
}

describe('User controller unit test', function () {
    var user1;
    var Json1 = {
        provider: 'testprovider',
        socialNetworkId: 1,
        notRegistered: true,
        displayName: 'testprovider_1'
    };
    var user2;
    var Json2 = {
        provider: 'testprovider',
        socialNetworkId: 2,
        notRegistered: false,
        displayName: 'testprovider_2'
    };
    var skipCheck = {
        provider: true,
        socialNetworkId: true

    };
    function checkSaved() {

        var request = createRequest({method: 'GET', url: '/api/user'}, user1);
        var response = createResponse();
        ctr.user(request, response);
        var json = JSON.parse(response._getData());
        for (var i in Json1) {
            if (!(i in skipCheck) || !skipCheck[i] ) {
                assert.equal(json[i], Json1[i]);
            }

        }
    }

    before(function () {
        clear();
        user1 = new User(Json1);
        user2 = new User(Json2);
        return when.all([user1.save(), user2.save()]);
        //return user1.save();// here we return promise.
    });
    //beforeEach(function (done) {
    //    app = require('../passportHelper').prepApp(done);
    //});
    it('get user', function () {
        var request = createRequest({method: 'GET', url: '/api/user'}, user1);
        var response = httpMocks.createResponse();
        ctr.user(request, response);
        var json = JSON.parse(response._getData());
        assert.equal(response.statusCode, 200);
        assert.equal(json.notRegistered, true);
        assert.equal(json.followers, 0);
        assert.equal(json.follows, 0);
        assert.equal(json.avatar, 'http://placehold.it/100x100');

    });
    it('post displayName', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user',
            body: {
                displayName: 'newDisplayName'
            }
        };
        var request = createRequest(data, user1);
        var response = createResponse();
        ctr.postUser(request, response);

        response.on('end', function () {
            //assert.equal(response._getRedirectUrl(), '/api/user');
            //assert.equal(response.statusCode, 302);
            assert.equal(response.statusCode, 200);
            Json1.notRegistered = undefined;
            Json1.displayName = 'newDisplayName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json1[i]);
                }
            }

            done();
        });

    });
    it('get posted displayName', checkSaved);
    it('post conflict displayName to user2', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user',
            body: {
                displayName: 'newDisplayName'
            }
        };
        var request = createRequest(data, user2);
        var response = createResponse();
        ctr.postUser(request, response);

        response.on('end', function () {
            //assert.equal(response._getRedirectUrl(), '/api/user');
            //assert.equal(response.statusCode, 302);
            assert.equal(response.statusCode, 409);
            done();
        });

    });
    it('post firstName', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user',
            body: {
                firstName: 'newFirstName'
            }
        };
        var request = createRequest(data, user1);
        var response = createResponse();
        ctr.postUser(request, response);

        response.on('end', function () {
            //assert.equal(response._getRedirectUrl(), '/api/user');
            //assert.equal(response.statusCode, 302);
            assert.equal(response.statusCode, 200);
            Json1.isRegistered = undefined;
            Json1.firstName = 'newFirstName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json1[i]);
                }
            }
            done();
        });

    });
    it('get posted firstName', checkSaved);
    it('post lastName', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user',
            body: {
                lastName: 'newLastName'
            }
        };
        var request = createRequest(data, user1);
        var response = createResponse();
        ctr.postUser(request, response);

        response.on('end', function () {
            assert.equal(response.statusCode, 200);
            Json1.notRegistered = undefined;
            Json1.lastName = 'newLastName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json1[i]);
                }
            }
            done();
        });

    });
    it('get posted lastName', checkSaved);

    it('post description', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user',
            body: {
                description: 'my very cool description'
            }
        };
        var request = createRequest(data, user1);
        var response = createResponse();
        ctr.postUser(request, response);

        response.on('end', function () {
            //assert.equal(response._getRedirectUrl(), '/api/user');
            //assert.equal(response.statusCode, 302);
            assert.equal(response.statusCode, 200);
            Json1.notRegistered = undefined;
            Json1.description = 'my very cool description';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json1[i]);
                }
            }

            done();
        });

    });
    it('get posted description', checkSaved);
    describe('add user to followers', function () {
        //'/users/:login/follower'
        it('post user to followers', function (done) {//done required for assinc asserts
            var data = {
                method: 'POST',
                url: '/api/user',
                params: {login: user2.displayName}
            };
            var request = createRequest(data, user1);
            var response = createResponse();
            ctr.followUser(request, response);

            response.on('end', function () {
                //assert.equal(response._getRedirectUrl(), '/api/user');
                //assert.equal(response.statusCode, 302);
                assert.equal(response.statusCode, 200);
                //var json = JSON.parse(response._getData());
                assert.equals(user1.followers.length, 1);
                assert.equals(user2.follows.length, 1);
                done();
            });

        });
    });
    after(function (done) {
        clear();
        done();
    });
});
