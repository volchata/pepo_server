'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var schema = new Schema({
    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    content: {
        type: String
    },
    timestamp: {type: Date, default: Date.now},
    extras: {
        parentTweetId: {
            type: Schema.Types.ObjectId,
            ref: 'Tweet'
        },
        commentedTweetId: {
            type: Schema.Types.ObjectId,
            ref: 'Tweet'
        },
        comments: [{type: Schema.Types.ObjectId, ref: 'Tweet'}],
        likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
        image: {type: String},
        url: {type: String},
        geo: {type: Schema.Types.Mixed}
    }
});

exports.Tweet = mongoose.model('Tweet', schema);
exports.Mongoose = mongoose;
