'use strict';

var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;

var twit = new Schema({

    id: {
        type: Number,
        unique: true,
        required: true
    },

    author: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},

    content: {
        type: String
    },
    timestamp: {type: Date, default: Date.now},
    extras: [
        {tweet: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'this',
            required: false}},     // если это ретвит, то идентификатор его "родительского" твита
        {image: {type: String}},    // если в твите картинка, то ссылка на неё
        {url: {type: String}},          // ???
        {geo: {type: Schema.Types.Mixed}}           // гео-метка
    ]
});

exports.Twit = mongoose.model('Twit', twit);
exports.Mongoose = mongoose;
