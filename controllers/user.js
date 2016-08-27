'use strict';

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
function user(req, res) {
    res.json(userToData(req.user));
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

module.exports = {
    user,
    postUser,
    userToData
};
