'use strict';

function getGeoIp(req, res) {
    if (req.geoip) {
        res.json({geoIp: {ll: req.geoip.ll}});
    } else {
        res.json(null);
    }
}

module.exports = {
    getGeoIp
};
