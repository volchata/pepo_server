var controllers = require('./controllers'),
    fillHellow = controllers.fakeResults.fillHellow;

function setHandlers(server) {

    server.get('/user/:id/exist', function (req, res, next) {
        res.send({exist: false});
        return next(false);
    });

    server.get('/login', function (req, res) {
        res.send({
            login: true,
            tweets: fillHellow()
        });
    });

    server.get('/user/:id/twitt', function (req, res) {
        res.send({
            tweets: fillHellow(req.query.limit, req.query.offset)
        });
    });
}

module.exports.set = setHandlers;
