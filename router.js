

var restify = require('restify');
var path = require('path');


function setHandlers( server ) {

	server.get(/\/public\/?.*/, restify.serveStatic({
		directory: __dirname,
		default: 'index.html'
	}));
	server.get(/\/(index.html)?/, restify.serveStatic({
		directory: path.join(__dirname, '/public'),
		default: 'index.html'
	}));

	server.get('/user/:login', function (req, res, next) {
	  res.send('Hello world.  Here will be user '+ req.params.name +' json in future');
	  return next(false);
	});

}


module.exports.set = setHandlers
