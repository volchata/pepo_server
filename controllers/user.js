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
    var data = {
        displayName: req.user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        description: req.user.description,
        avatar: 'http://placehold.it/100x100'
    };
    if (req.user.notRegistered) {
        data.notRegistered = true;
    }

    res.json(data);
}

function postUser(req, res) {
    var modified = false;
    for (var i of ['displayName', 'firstName', 'lastName', 'description']) {
        if (typeof req.body[i] !== 'undefined') {
            req.user[i] = String(req.body[i]).trim();
            modified = true;
        }
    }

    if (modified) {
        req.user.notRegistered = false;
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
