var User = require('../models/user').User;

function getUsers (req, res){
    User.find({}, (err, users) => {
        if(err) return next(err);
        res.json(users);
    })
}

module.exports.getUsers = getUsers;
