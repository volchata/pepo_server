'use strict';
var os = require('os');
var config = require('../conf');

var origin = 'http://volchata.ml';
var port = config.get('server:portCallback');

if (os.hostname() !== 'volchata') {
    origin += ' http://localhost' ;
    if (port) {
        origin += ':' + port;
    }
}

module.exports = function (req, res, next) {

    // Website you wish to allow to connect, example http://localhost:8888
    res.setHeader('Access-Control-Allow-Origin', origin);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
};
