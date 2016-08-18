'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var schema = new Schema({

    id: {
        type: Number,
        unique: true,
        required: true
    },

    login: {
        type: String,
        required: true,
        unique: true
    },

    provider: {
        type: String
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

exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
