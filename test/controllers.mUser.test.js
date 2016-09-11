'use strict';

var httpMocks = require('node-mocks-http');
var ctr = require('../controllers/mUser');
var assert = require('chai').assert;

function clear() {
}

function createRequest(data, connection) {

    var request = httpMocks.createRequest(data);
    request.connection = connection;
    return request;
}
function createResponse() {
    return httpMocks.createResponse({
        eventEmitter: require('events').EventEmitter
    });
}

describe('mUser middleware tests', function () {

    before(function () {
        clear();
    });
    //beforeEach(function (done) {
    //    app = require('../passportHelper').prepApp(done);
    //});
    describe('geoip', function () {
        it('undefined by default', function (done) {
            var request = createRequest({method: 'GET'});
            var response = createResponse();
            response.on('end', function () {
                assert.Fail();
                done();
            });
            ctr.geoIpInfo(request, response, function () {
                assert( request.geoip === undefined);
                done();
            });

        });

        it('remote address with strange data', function (done) {
            var request = createRequest({method: 'GET'}, {remoteAddress: 'ollolo.trol.lo.lo'});
            var response = createResponse();
            response.on('end', function () {
                assert.Fail();
                done();
            });
            ctr.geoIpInfo(request, response, function () {
                assert( request.geoip === null);
                done();
            });
        });

        it('dirrect request from yandex', function (done) {
            var request = createRequest({method: 'GET'}, {remoteAddress: '213.180.217.10'});
            var response = createResponse();
            response.on('end', function () {
                assert.Fail();
                done();
            });
            ctr.geoIpInfo(request, response, function () {
                assert( request.geoip !== undefined);
                assert.equal(request.geoip.country, 'RU');
                done();
            });
        });

        it('request from google via yandex', function (done) {
            var request = createRequest({
                method: 'GET',
                headers: {'x-forwarded-for': '209.185.108.134'}
            }, {remoteAddress: '213.180.217.10'});
            var response = createResponse();
            response.on('end', function () {
                assert.Fail();
                done();
            });
            ctr.geoIpInfo(request, response, function () {
                assert( request.geoip !== undefined);
                assert.equal(request.geoip.country, 'US');
                done();
            });

        });
    });

    after(function (done) {
        clear();
        done();
    });
});
