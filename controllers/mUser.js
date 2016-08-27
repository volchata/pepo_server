'use strict';
module.exports = {currentUser: function (req, res, next) {
    if (req.isUnauthenticated()) {
        res.status(403).send({status: 'Unauthenticated'});
    } else {
        next();
    }
},
    limitData: function (req, res, next) {
        let l = parseInt(req.params.limit, 10);
        if (isNaN(l) || l < 10 || l > 100) {
            l = 50;
        }
        req.params.limit = l;
        next();
    }
};
