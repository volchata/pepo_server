'use strict';

var restify = require('restify');
var router = require('./router');
var morgan = require('morgan');

var server = restify.createServer({
    name: 'pepo',
    version: '0.1.0'
});
server.use(morgan('combined'));
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

router.set(server);
