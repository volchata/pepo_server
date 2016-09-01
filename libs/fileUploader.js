
var multer = require('multer');
var path   = require('path');
var conf   = require('../conf');
var mkdirp = require('mkdirp');
var crypto = require('crypto');

var base = conf.get('storage:dir');
var web  = conf.get('storage:web');

var splitter = /(.{2})(.{3})(.{7})/;

function getHashString( ){
    var sum = crypto.createHash('sha1');
    var data = Array.prototype.join.call(arguments, '_');
    sum.update(data);
    return sum.digest('hex');
}

function genFilePath(userName, filename){
    var ext = path.extname(filename);
    var str = getHashString(userName, Date.now(), filename);
    var ps  = splitter.exec(str).slice(1);
    var file = ps.splice(-1, 1)[0] + ext;
    var url = web + '/' + ps.join('/') + '/' + file;
    ps.splice(0, 0, base);
    var ret = { path: path.join.apply(path, ps), file, url };
    ret.fullpath = path.join(ret.path, ret.file);
    return ret;
}

function genFPath(req, file){
    var ret = genFilePath(req.user.displayName, file.originalname);
    file.path = path.join(ret.path, ret.file);
    file.url = ret.url;
    return ret;
}

function makeUploader(handler){

    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        var r = req.fileDestinaion = genFPath(req, file);
        file.owner = req.user;
        mkdirp(r.path, (err) => {
            if (err) return cb(err);
            if (handler instanceof Function){
                handler(file, (error)=>{
                    if (error) console.error(error);
                    cb(error, r.path);
                });
            } else {
                cb(null, r.path);
            }
        })
      },
      filename: function (req, file, cb) {
        cb(null, req.fileDestinaion.file);
      }
    })
 
    return multer({ storage });
}

module.exports.create = makeUploader;
module.exports.genFilePath = genFilePath;