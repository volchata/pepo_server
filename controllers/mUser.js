'use strict';
module.exports = function (req, res, next) {
    if (req.isUnauthenticated()) {
        res.status(403).send({status: 'Unauthenticated'});
    } else {
        next();
    }
};
