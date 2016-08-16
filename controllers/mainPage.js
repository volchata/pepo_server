'use strict';

function hello(req, res) {
    res.json({mainPage: true});
}

module.exports.hello = hello;
