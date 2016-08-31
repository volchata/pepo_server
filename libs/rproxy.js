
var config = require('../conf');
var httpProxy = require('http-proxy');

var proxy = httpProxy.createProxyServer({});

var clientServer = 'http://' +config.get('client:host')+ ':' + config.get('client:port');

function proxyErrorHandler(err, req, res, url){
	console.error('Proxy error ocurred: '+err+'\n', err);
	var str = '<h1>:\'-(</h1> ';
	str += '<h2>Уупппс.. Что-то пошло не так.</h2>'
	str += '<h3>Попробуйте, пожалуйста, позже</h3>';
	str += '<a href='+req.originalUrl+'>Попробовать</a>'
	res.status(500).send(str);
}

proxy.on('error', proxyErrorHandler, proxy);

module.exports = function(req, res, next) {
	// console.log('Redirected to client ');
	proxy.web(req, res, {target: clientServer});
};

