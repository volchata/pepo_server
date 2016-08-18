'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var schema = new Schema({

    displayName: {
        type: String,
        required: true

    },

    provider: {
        type: String
    },
    socialNetworkId: {
        type: Number,

        required: true
    },

    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    photo: {
        type: String
    },
    folowers: [{type: Schema.Types.ObjectId, ref: 'this'}],
    friends: [{type: Schema.Types.ObjectId, ref: 'this'}]

});
schema.index({provider: 1, id: 1}, {unique: true});

exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
