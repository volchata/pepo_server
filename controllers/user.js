var User = require('../models/user').User;

function getUsers (req, res){
    User.find({}, (err, users) => {
        if(err) return next(err);
        res.json(users);
    })
}

function user (req, res){
    res.send(`Hello ${req.user.userName}, your ID: ${req.user.userID} <a href="/logout">LOGOUT</a>`);
}

module.exports = {
    getUsers,
    user
}
