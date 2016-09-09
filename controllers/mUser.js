'use strict';
var geoip = require('geoip-lite');

function isPrivateIP(ip) {
    var parts = String(ip).split('.');
    return parts.length === 4 && (parts[0] === '10' ||
        (parts[0] === '172' && (parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)) ||
        (parts[0] === '192' && parts[1] === '168'));
}

module.exports = {
    limitData: function (req, res, next) {
        let l = parseInt(req.params.limit, 10);
        if (isNaN(l) || l < 10 || l > 100) {
            l = 50;
        }
        let o = parseInt(req.params.offset, 10);
        if (isNaN(o) || o < 0) {
            o = 0;
        }
        req.params.offset = o;
        req.params.limit = l;
        next();
    },

    geoIpInfo: function (req, res, next) {
        if (req.connection) {

            if (req.headers && req.headers['x-forwarded-for'] !== undefined) {
                var ip2 = req.headers['x-forwarded-for'];
                if (ip2 && !isPrivateIP(ip2)) {
                    req.geoip = geoip.lookup(ip2);
                }
            } else if (req.connection.remoteAddress !== undefined) {
                var ip = req.connection.remoteAddress;
                if (ip && !isPrivateIP(ip)) {
                    req.geoip = geoip.lookup(ip);
                }

            }

        }

        next();
    }
};
