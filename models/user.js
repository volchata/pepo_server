'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var schema = new Schema({

    displayName: {
        type: String,
        required: true,
        unique: true
    },
    provider: {
        type: String
    },
    socialNetworkId: {
        type: Number,
        required: true
    },
    notRegistered: {type: Boolean, default: true},
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    avatar: {
        type: String
    },
    description: {
        type: String
    },
    folowers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    friends: [{type: Schema.Types.ObjectId, ref: 'User'}]

});

schema.index({provider: 1, socialNetworkId: 1}, {unique: true});

schema.statics.isUser = function (req, res, err, user, next) {
    if (err) {
        next(err);
        return false;
    }

    if (!user) {
        res.status(404).send({status: 'User not found'});
        return false;
    }

    return true;
};

exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
