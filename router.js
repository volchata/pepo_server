'use strict';

var restify = require('restify');
var path = require('path');

function setHandlers(server) {

    server.get('/user/:login', function (req, res, next) {
        res.send('Hello world.  Here will be user ' + req.params.name + ' json in future');
        return next(false);
    });

}

module.exports.set = setHandlers;
