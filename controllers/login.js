'use strict';

function login(req, res) {
    res.json({FB: '/auth/fb', VK: '/auth/vk'});
}

module.exports.login = login;
