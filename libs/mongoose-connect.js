var config = require('../conf'),
    mongoose = require("mongoose");

console.log('Using DB: ', config.get("mongoose:uri").replace(/:\/\/[^@]*@/,'://<login>:<password>@'));
mongoose.connect(config.get("mongoose:uri"), config.get("mongoose:options"));

module.exports = mongoose;
