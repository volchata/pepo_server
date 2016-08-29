'use strict';

var mongoose = require('../libs/mongoose-connect');

var schema = new mongoose.Schema({

    path: {
        type: String,
        required: true,
        unique: true
    },
    url: {
        type: String,
        required: true,
        unique: true
    },
    commited: {type: Boolean, default: false},
    toRemove: {type: Boolean, default: false},
    timeStamp: {type: Number, default: Date.now}

});

var File;

schema.index({url: 1});
schema.index({toRemove: 1});

schema.methods.rm = function (cb) {
    this.toRemove = true;
    this.save((err) => {
        cb(err, this);
    });
};

schema.methods.commit = function (cb) {
    this.commited = true;
    this.save((err) => {
        if (cb instanceof Function) {
            cb(err, this);
        }
    });
};

schema.statics.getNotCommited = function (time, cb) {
    File.findOne({
        commited: false,
        timeStamp: {$lt: time}
    }).exec(cb);
};

schema.statics.getRemoving = function (cb) {
    File.findOne({
        toRemove: true
    }).exec(cb);
};

schema.statics.setToRemoveByURL = function (url, cb) {
    File.findOne({url}).exec((err, file)=>{

        if (err) {
            if (cb instanceof Function) {
                return cb(err);
            }
            return;
        }
        file.rm(cb);
    });
};

File = module.exports = mongoose.model('File', schema);
