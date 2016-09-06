'use strict';

function userToData(user) {
    var data = {
        displayName: user.displayName,
        //socialNetworkId: req.user.socialNetworkId,
        //provider: req.user.provider,
        firstName: user.firstName,
        lastName: user.lastName,
        description: user.description,
        avatar: user.avatar ? user.avatar : 'http://placehold.it/100x100'
    };
    if (typeof user.followers !== 'undefined') {
        data.followers = user.followers.length;
    }
    if (typeof user.follows !== 'undefined') {
        data.follows = user.follows.length;
    }

    if (user.notRegistered) {
        data.notRegistered = true;
    }
    return data;
}

function textEscapeForRE(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\n|\r|\n\r|\r\n/g, '');
}

module.exports = {
    userToData,
    textEscapeForRE
};