'use strict';

var chai = require('chai');
var chaiHttp = require('chai-http');
var config = require('../conf');

chai.should();
chai.use(chaiHttp);

var app = 'http://' + config.get('server:host') + ':' + config.get('server:port');
process.env.NODE_ENV = 'test';
require('../main');

console.log('Testing on: ', app);

// { m:'get', url:'/' },
// { m:'get' , url:'/auth/vk' },
// { m:'get' , url:'/auth/fb' },

var protectedPoints = [
    {m: 'get', url: '/api/user/'},
    {m: 'post', url: '/api/user/'},
    {m: 'get', url: '/api/user/:login'},
    {m: 'get', url: '/api/user/:login/follower'},
    {m: 'get', url: '/api/user/:login/friends'},
    {m: 'post', url: '/api/user/:login/friends'},
    {m: 'get', url: '/api/user/:login/feed'},
    {m: 'get', url: '/api/user/:login/feed/history'},
    {m: 'post', url: '/api/user/:login/feed'},
    {m: 'get', url: '/api/tweet/:id'},
    {m: 'post', url: '/api/tweet/:id'},
    {m: 'post', url: '/api/tweet/:id/retweet'}
];

describe('Unauthed access:', function () {
    // eslint-disable-next-line no-invalid-this
    this.timeout(1000);

    describe('"/" should redirect to /auth:', function () {
        it('GET /', function () {
            return chai.request(app).get('/')
                .then(function (res) {
                    res.should.redirectTo(app + '/auth');
                }).catch(function (err) {
                    err.response.should.redirectTo(app + '/auth');
                });
        });
    });

    describe('protected points should return status 403 with JSON {"status": "..."}:', function () {
        protectedPoints.forEach((point) => {
            it(point.m + ' ' + point.url, function () {
                return chai.request(app)[point.m](point.url)
                .then(function (res) {
                    res.should.have.status(403);
                    // eslint-disable-next-line no-unused-expressions
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.have.property('status');
                }).catch(function (err) {
                    err.should.have.status(403);
                    // eslint-disable-next-line no-unused-expressions
                    err.response.should.be.json;
                    err.response.body.should.be.a('object');
                    err.response.body.should.have.property('status');
                });
            });
        });
    });
});

describe('Authentication should redirect to /feed and contain HTML', function () {
    it('/auth/fb');
    it('/auth/vk');
});

// функция-заготовка на будущее для проверки выдаваемых JSON
// function jsonChecker(res) {
//     res.should.have.status(200);
//     // eslint-disable-next-line no-unused-expressions
//     res.should.be.json;
//     res.body.should.be.a('object');
// }

describe('Authed access:', function () {
    // eslint-disable-next-line no-invalid-this
    this.timeout(1000);
    it('get /auth should redirect to /feed');

    protectedPoints.forEach((point) => {
        it(point.m + ' ' + point.url + 'should return JSON object');
    });

    describe('to unexistent points:', function () {
        it('Should return 404');
        // , function () {
        //     return chai.request(app).get('/some/point')
        //     .then(function (res) {
        //         res.should.have.status(404);
        //     }).catch(function (err) {
        //         err.should.have.status(404);
        //     });
        // });
    });
});
