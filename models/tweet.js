'use strict';

var mongoose = require('../libs/mongoose-connect');
require('mongoose-geojson-schema');
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
        retweets: [{type: Schema.Types.ObjectId, ref: 'User'}],
        commentedTweetId: {
            type: Schema.Types.ObjectId,
            ref: 'Tweet'
        },
        comments: [{type: Schema.Types.ObjectId, ref: 'Tweet'}],
        likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
        image: {type: String},
        attachment: {type: Schema.Types.Mixed},
        url: {type: String},
        //geo: {type: Schema.Types.Mixed}
        geo: {type: Schema.Types.Feature}
    }
});
schema.index({'extras.geo.geometry': '2dsphere'});
/**
 * @param coords Array [lon,lat]
 * @returns {*}
 */
schema.statics.byDistance = function (coords) {
    return this.find({'extras.geo.geometry':
        {$nearSphere: {$geometry: {type: 'Point', coordinates: coords}, $maxDistance: 1000}}});
};
schema.statics.PopularImages = function () {
    return this.aggregate([
        {
            $match: {
                'extras.image': {$exists: true, $ne: ''}
            }
        },
        {
            $project: {
                'extras.image': 1,
                imlikes: {$size: '$extras.likes'}
            }
        },
        {
            $sort: {
                imlikes: -1
            }
        }

    ]);
};
schema.statics.userTweetsCombined = function (user) {
    var all = this.find({author: user._id}).sort({timestamp: -1}).limit(10).exec();
    var images = this.find({
        author: user._id,
        'extras.image': {$exists: true, $ne: ''}
    }).sort({timestamp: -1}).limit(10).exec();
    var liked = this.find({'extras.likes': user._id}).sort({timestamp: -1}).limit(10).exec();
    return Promise.all([all, images, liked]);
};
exports.Tweet = mongoose.model('Tweet', schema);
exports.Mongoose = mongoose;
