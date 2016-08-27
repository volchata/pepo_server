'use strict';

var httpMocks = require('node-mocks-http');
var ctrUser = require('../controllers/user');
var ctrUsers = require('../controllers/users');
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
            //console.log(['data',response._getData()]);
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
        ctrUsers.getUserByLogin(request, response);
        response.on('end', function () {
            assert.equal(response.statusCode, 200);
            var json = JSON.parse(response._getData());
            for (var i in Json2) {
                if (!(i in skipCheck) || !skipCheck[i] ) {
                    assert.equal(json[i], Json2[i]);
                }
            }
            done();
        });

    });

    after(function (done) {
        clear();
        done();
    });
});
