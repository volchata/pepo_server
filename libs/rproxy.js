
var config = require('../conf');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({});

var clientServer = 'http://' +config.get('client:host')+ ':' + config.get('client:port');

module.exports = function(req, res, next) {
	// console.log('Redirected to client ');
	proxy.web(req, res, {target: clientServer});
};

