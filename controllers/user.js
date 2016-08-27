'use strict';
//var User = require('../models/').User;
function userToData(user) {
    var data = {
        displayName: user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description,
        avatar: 'http://placehold.it/100x100'
    };
    if (user.notRegistered) {
        data.notRegistered = true;
    }
    return data;
}

/**
 * @api {get} /api/user Get user profile
 * @apiGroup User
 * @apiName GetUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {String} notRegistered Set if user does not send initial profile update after social login
 * @apiError (Errors) 403 Access denied
 * @param req
 * @param res
 */
function user(req, res) {
    res.json(userToData(req.user));
}
/**
 * @api {post} /api/user Update user profile
 * @apiGroup User
 * @apiName PostUser
 * @apiVersion 0.1.0
 * @apiSuccess (200) {String} displayname Displayname of the User.
 * @apiSuccess (200) {String} firstName Firstname of the User.
 * @apiSuccess (200) {String} lastName Lastname of the User.
 * @apiSuccess (200) {String} description Description of the User.
 * @apiSuccess (200) {String} avatar Avatar of the User.
 * @apiSuccess (200) {String} notRegistered Set if user does not send initial profile update after social login
 * @apiError (Errors) 409 Duplicate key
 * @apiError (Errors) 403 Access denied
 * @apiError (Errors) 400 Error
 * @param req
 * @param res
 */
function postUser(req, res) {
    var modified = false;
    var data = {};
    for (var i of ['displayName', 'firstName', 'lastName', 'description']) {
        if (typeof req.body[i] !== 'undefined') {
            req.user[i] = String(req.body[i]).trim();
            data[i] = req.user[i];
            modified = true;
        }
    }

    if (modified) {
        req.user.notRegistered = false;
        data.notRegistered = false;
        /*User.findOneAndUpdate({_id: req.user._id}, {$set: data}, {new: true}, function (err, user) {
            if (err) {
                if ( err.code === 11000 ) {
                    res.status(409).send({status: 'Duplicate key'});
                } else {
                    res.status(400).send({status: 'Error saving data'});
                }

            } else {
                //res.redirect('/api/user');
                res.json(userToData(user));
            }
        });*/
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

module.exports = {
    user,
    postUser,
    userToData
};
