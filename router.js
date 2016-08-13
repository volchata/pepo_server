'use strict';

var restify = require('restify');
var path = require('path');
var mongoose = require('mongoose');
var User   = require('./app/models/user');
var conf = require('./conf');
mongoose.connect(conf.get('database'));

/*function User(login,password){
 this.login=login;
 this.password=password;
 }
 var users=[];*/
function listUsers(req,res,next){
    User.find({}, function(err, users) {
        var userMap = {};

        users.forEach(function(user) {
            userMap[user._id] = user;
        });

        res.send(200,userMap);
    });

}
function createUser(req,res,next){
//console.log(req);
    var login = req.params.login;
    console.log(login);
    var user=new User({login:login});
    user.save(function (err, user) {
        if (err){
            console.error(err.toJSON());
            res.send(400);
        }
        console.log([user])
        res.send(200,user);
    });


}



function setHandlers(server) {

    server.get('/user/:login', function (req, res, next) {
        res.send('Hello world.  Here will be user ' + req.params.name + ' json in future');
        return next(false);
    });




    server.get('/users/',listUsers );
//server.head('/hello/:name', respond);
    server.post('/users/',createUser)

    server.listen(8080, function() {
        console.log('%s listening at %s', server.name, server.url);
    });


}

module.exports.set = setHandlers;
