'use strict';

var User = require('../models/user').User;

function getUsers(req, res, next) {
    User.find({}, (err, users) => {
        if (err) {
            return next(err);
        }
        res.json(users);
    });
}

function user(req, res) {
    res.json({
        displayName: req.user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        isRegistered: req.user.isRegistered, //only if true
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        avatar: 'http://placehold.it/100x100'
        //descripion

    });
}

function postUser(req, res) {
    var modified = false;
    for (var i of ['displayName', 'firstName', 'lastName']) {
        if (typeof req.body[i] !== 'undefined') {
            req.user[i] = String(req.body[i]).trim();
            modified = true;
        }
    }

    if (modified) {
        req.user.isRegistered = true;
        req.user.save(function (err) {
            if (err) {
                if ( err.code === 11000 ) {
                    res.status(409).send({status: 'Duplicate key'});
                } else {
                    res.status(400).send({status: 'Error saving data'});
                }

            } else {
                //res.redirect('/api/user');
                user(req, res);
            }
        });
    } else {
        //res.redirect('/api/user');
        user(req, res);
    }

}

function stub(req, res) {
    res.json({stub: 'data'});
}

module.exports = {
    getUsers,
    user,
    stub,
    postUser
};
