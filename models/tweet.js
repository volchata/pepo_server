'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var tweet = new Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    content: {
        type: String
    },
    timestamp: {type: Date, default: Date.now},
    extras: {
        prevTweetId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'this',
            required: false},
        image: {type: String},
        url: {type: String},
        geo: {type: Schema.Types.Mixed}
    }
});

exports.Tweet = mongoose.model('Tweet', tweet);
exports.Mongoose = mongoose;
