'use strict';

var mongoose = require('../libs/mongoose-connect');
mongoose.Promise = global.Promise;

var REscape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
var Schema = mongoose.Schema;

var schema = new Schema({
    title: {
        type: String,
        unique: true
    }
});

schema.statics.search = function (displayName) {
    return this.find({title: new RegExp(REscape(displayName))});
};

exports.Interest = mongoose.model('Interest', schema);
exports.Mongoose = mongoose;
