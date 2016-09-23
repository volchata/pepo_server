'use strict';

var mongoose = require('../libs/mongoose-connect');
mongoose.Promise = global.Promise;

var REscape = function (s) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};
var Schema = mongoose.Schema;
var User;

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
    followers: [{type: Schema.Types.ObjectId, ref: 'User'}],
    follows: [{type: Schema.Types.ObjectId, ref: 'User'}],
    friends: [{type: Schema.Types.ObjectId, ref: 'User'}],
    interests: [{type: Schema.Types.ObjectId, ref: 'Interest'}]

});

schema.index({provider: 1, socialNetworkId: 1}, {unique: true});

schema.statics.byDisplayname = function (displayName) {
    return this.findOne({
        $and: [{displayName: displayName}, {notRegistered: false}]
    });
};
schema.statics.search = function (displayName) {

    return this.find({
        $and: [{displayName: new RegExp(REscape(displayName))}, {notRegistered: false}]
    });
};

schema.statics.isUser = function (req, res, err, user, next) {
    if (err) {
        next(err);
        return false;
    }

    if (!user) {
        res.status(404).json({status: 'User not found'});
        return false;
    }

    return true;
};

schema.statics.getByReq = function (req, res, next, mod) {
    var q = User.findOne({
        $and: [
                {socialNetworkId: req.user.socialNetworkId},
                {provider: req.user.provider}
        ]
    });

    if (mod instanceof Function) {
        mod(q);
    }

    return q.exec((err, user)=>{
        if (err) {
            next(err);
            return false;
        }

        if (!user) {
            res.status(404).json({status: 'User not found'});
            return false;
        }

        return user;
    });

};

User = exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
