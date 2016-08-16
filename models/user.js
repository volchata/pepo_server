'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var schema = new Schema({
    userName: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        unique: true,
        required: true
    },
    provider: {
        type: String
    }
});

exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
