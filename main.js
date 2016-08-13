var restify = require('restify');
var conf = require('./conf');
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

server.listen(conf.get('server:port'), function () {
  console.log('%s listening at %s', server.name, server.url);
});
