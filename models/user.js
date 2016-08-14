var mongoose = require('../libs/mongoose-connect');
var Schema = mongoose.Schema;


var schema = new Schema({
    username: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        unique: true,
        required: true
    }
});

exports.User = mongoose.model('User', schema);
exports.Mongoose = mongoose;
