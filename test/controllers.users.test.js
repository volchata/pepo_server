'use strict';

var httpMocks = require('node-mocks-http');
var ctrUser = require('../controllers/user');
var ctrUsers = require('../controllers/users');
var User = require('../models/user').User;
//var assert = require('assert');
var assert = require('chai').assert;
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
        notRegistered: false,
        displayName: 'testprovider_1'
    };
    var user2;
    var Json2 = {
        provider: 'testprovider',
        socialNetworkId: 2,
        notRegistered: true,
        displayName: 'testprovider_2',
        firstName: 'myFirstName',
        lastName: 'myLastName',
        description: 'myDescription',
        avatar: 'http://placehold.it/100x100'
    };
    var skipCheck = {
        provider: true,
        socialNetworkId: true

    };

    before(function () {
        clear();
        user1 = new User(Json1);
        user1.notRegistered = false;
        user2 = new User(Json2);

        return when.all([user1.save(), user2.save()]);
        //return user1.save();// here we return promise.
    });
    it('user1 get profile of not registered user2', function (done) {
        var request = createRequest({
            method: 'GET',
            url: '/api/users/' + Json2.displayName,
            params: {login: Json2.displayName}}, user1);
        var response = createResponse();
        ctrUsers.getUserByLogin(request, response);
        response.on('end', function () {
            assert.equal(response.statusCode, 404);
            done();
        });

    });
    it('register user2', function (done) {//done required for assinc asserts
        var data = {
            method: 'POST',
            url: '/api/user'

        };
        data.body = Json2;
        var request = createRequest(data, user2);
        var response = createResponse();
        ctrUser.postUser(request, response);

        response.on('end', function () {
            var json = JSON.parse(response._getData());
            assert.equal(response.statusCode, 200);
            Json2.notRegistered = undefined;

            for (var i in Json2) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json2[i]);
                }
            }
            done();
        });

    });
    it('user1 get profile of registered user2', function (done) {
        var request = createRequest({
            method: 'GET',
            url: '/api/users/' + Json2.displayName,
            params: {login: Json2.displayName}}, user1);
        var response = createResponse();
        ctrUsers.getUserByLogin(request, response, function (err) {
            console.log(['TTT', err]);
        });
        response.on('end', function () {
            assert.equal(response.statusCode, 200);
            var json = JSON.parse(response._getData());
            assert(json.users[user2.id] !== undefined);
            done();
        });

    });
    describe('user followers', function () {
        var followers = [];
        it('get followers of unexistedUser', function (done) {
            var login = 'ThisGameHasNoName' + (new Date());
            var request = createRequest({
                method: 'GET',
                url: '/api/user/' + login + '/follower',
                params: {login}
            }, user1);
            var response = createResponse();
            ctrUsers.getUserFollowers(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
        it('user1 has no followers. get followers', function (done) {
            var request = createRequest({
                method: 'GET',
                url: '/api/user/' + Json1.displayName + '/follower',
                params: {login: Json1.displayName}
            }, user1);
            var response = createResponse();
            ctrUsers.getUserFollowers(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 204);
                done();
            });
        });

        it('user1 has 300 followers. get followers', function (done) {
            var JsonI;
            for (var i = 0; i < 300; i++) {
                JsonI = Object.assign({}, Json1);
                JsonI.notRegistered = false;
                JsonI.displayName = 'follower_' + i;
                JsonI.socialNetworkId = 1000 + i;
                followers[i] = new User(JsonI);
                followers[i].save();

            }
            user1.followers = followers;
            user1.save(function (err, user1) {

                var request = createRequest({
                    method: 'GET',
                    url: '/api/user/' + Json1.displayName + '/follower',
                    params: {login: Json1.displayName}
                }, user1);
                var response = createResponse();
                ctrUsers.getUserFollowers(request, response);
                response.on('end', function () {
                    assert.equal(response.statusCode, 200);
                    var json = JSON.parse(response._getData());
                    assert.equal(json.limit, 50);
                    assert.equal(json.offset, 0);
                    assert.lengthOf(json.data, 50);
                    assert.equal(json.total, 300);
                    done();
                });
            });

        });
    });
    describe('user search', function () {
        var users = [];
        it('search user', function (done) {
            var JsonI;
            for (var i = 0; i < 300; i++) {
                JsonI = Object.assign({}, Json1);
                JsonI.notRegistered = false;
                JsonI.displayName = 'follower_' + i;
                Json1.socialNetworkId = 1000 + i;
                users[i] = new User(JsonI);
                users[i].save();

            }
            var request = createRequest({
                method: 'GET',
                url: '/api/users/search/fol',
                params: {search: 'fol'}
            }, user1);
            var response = createResponse();
            ctrUsers.searchUsers(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 200);
                var json = JSON.parse(response._getData());
                assert.lengthOf(json, 10);

                done();
            });

        });

        it('search unexisted user', function (done) {
            var login = '___NO' + (new Date());
            var request = createRequest({
                method: 'GET',
                url: '/api/users/search/' + login,
                params: {search: login}
            }, user1);
            var response = createResponse();
            ctrUsers.searchUsers(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 200);
                var json = JSON.parse(response._getData());
                assert.lengthOf(json, 0);
                done();
            });

        });
    });
    describe('user follows', function () {
        var follows = [];
        it('get follows of unexistedUser', function (done) {
            var login = 'ThisGameHasNoName' + (new Date());
            var request = createRequest({
                method: 'GET',
                url: '/api/user/' + login + '/follows',
                params: {login}
            }, user1);
            var response = createResponse();
            ctrUsers.getUserFollows(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 404);
                done();
            });
        });
        it('user1 has no follows. get follows', function (done) {
            var request = createRequest({
                method: 'GET',
                url: '/api/user/' + Json1.displayName + '/follows',
                params: {login: Json1.displayName}
            }, user1);
            var response = createResponse();
            ctrUsers.getUserFollows(request, response);
            response.on('end', function () {
                assert.equal(response.statusCode, 204);
                done();
            });
        });

        it('user1 has 300 follows. get follows', function (done) {
            var JsonI;
            for (var i = 0; i < 300; i++) {
                JsonI = Object.assign({}, Json1);
                JsonI.isRegistered = true;
                JsonI.displayName = 'follower_' + 2000 + i;
                JsonI.socialNetworkId = 2000 + i;
                follows[i] = new User(JsonI);
                follows[i].save();

            }
            user1.follows = follows;
            user1.save(function (err, user1) {

                var request = createRequest({
                    method: 'GET',
                    url: '/api/user/' + Json1.displayName + '/follows',
                    params: {login: Json1.displayName}
                }, user1);
                var response = createResponse();
                ctrUsers.getUserFollows(request, response);
                response.on('end', function () {
                    assert.equal(response.statusCode, 200);
                    var json = JSON.parse(response._getData());
                    assert.equal(json.limit, 50);
                    assert.equal(json.offset, 0);
                    assert.lengthOf(json.data, 50);
                    assert.equal(json.total, 300);
                    done();
                });
            });

        });
    });

    after(function (done) {
        clear();
        done();
    });
});
