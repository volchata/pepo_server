'use strict';

var restify = require('restify');
var path = require('path');

function setHandlers(server) {

    server.get('/user/:id/exist', function (req, res, next) {
        res.send({exist: false});
        return next(false);
    });

    server.get('/login', function (req, res, next) {
    	
        res.send({
        	login: "true",
        	tweets: fillHellow()
        });
        return next(false);
    });

    server.get('/user/:id/twitt', function (req, res, next) {
       	var helloW = [],
       		offset = req.query.offset || 0;
    	helloW.length = req.query.limit || 10;

        res.send({
        	tweets: fillHellow(req.query.limit, req.query.offset)
        });
        return next(false);
    });

    function fillHellow (limit, offset){
    	var helloW = [],
    	offset =  offset || 0;
    	helloW.length = limit || 10;

    	return helloW.fill("Hello world").map((value, index) => {
        		return value + '-' + (parseInt(offset) + index + 1);
        })

    }
}

module.exports.set = setHandlers;
