'use strict';

var httpMocks = require('node-mocks-http');
var ctr = require('../../controllers/user');
var User = require('../../models/user').User;
var assert = require('assert');

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
        isRegistered: false,
        displayName: 'testprovider_1'
    };

    function checkSaved() {
        var request = createRequest({method: 'GET', url: '/api/user'}, user1);
        var response = createResponse();
        ctr.user(request, response);
        var json = JSON.parse(response._getData());
        for (var i in Json1) {
            assert.equal(json[i], Json1[i]);
        }
    }

    before(function () {
        clear();
        user1 = new User(Json1);
        return user1.save();// here we return promise.
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
        assert.equal(json.isRegistered, false);
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
            Json1.isRegistered = true;
            Json1.displayName = 'newDisplayName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                assert.equal(json[i], Json1[i]);
            }

            done();
        });

    });
    it('get posted displayName', checkSaved);
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
            Json1.isRegistered = true;
            Json1.firstName = 'newFirstName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                assert.equal(json[i], Json1[i]);
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
            Json1.isRegistered = true;
            Json1.lastName = 'newLastName';
            var json = JSON.parse(response._getData());
            for (var i in Json1) {
                assert.equal(json[i], Json1[i]);
            }
            done();
        });

    });
    it('get posted lastName', checkSaved);
    after(function (done) {
        clear();
        done();
    });
});
