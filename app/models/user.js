/**
 * Created by sasha on 13.08.16.
 */
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//var bcrypt = require('bcrypt');

// Thanks to http://blog.matoski.com/articles/jwt-express-node-mongoose/

// set up a mongoose model
var UserSchema = new Schema({
    login: {
        type: String,
        unique: true,
        required: true
    },
    vk: {
        type: String,
        unique: true,
        required: false,
        sparse: true
    },
    fb: {
        type: String,
        unique: true,
        required: false,
        sparse:true
    }
    
});

/*
UserSchema.methods.comparePassword = function (passw, cb) {
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};
*/

module.exports = mongoose.model('User', UserSchema);
