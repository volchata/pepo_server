'use strict';
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
    }
};
