'use strict';

var File = require('../models/file');
var Tweet = require('../models/tweet').Tweet;
var Uploader = require('../libs/fileUploader');
var uploader = Uploader.create( addFile );
var mkdirp = require('mkdirp');
const fs = require('fs');
var conf = require('../conf');
var createSnapshot = require('./snapshot');

var snapFormat = conf.get('snapshotsFormat');
if ((!snapFormat) || (!snapFormat.lenght)) {
    snapFormat = 'jpg';
}

function logger(err) {
    if (err) {
        console.error(err);
    }
}

function addFile(file, cb) {
    var fo = {path: file.path, url: file.url, owner: file.owner._id};
    if (file.target) {
        fo.target = file.target;
    }

    var f = new File( fo );

    f.save((err)=>{
        if (err) {
            console.log('Error while saving file:');
            logger(err);
        }
        file.dbo = f;
        if (cb instanceof Function) {
            cb(err);
        }
    });
}

function doRemoveFile(path, cb ) {
    fs.unlink(path, (err) => {
        cb(err);
    });
}

function removeFile(url, cb) {

    File.setToRemoveByURL(url, (err1, file)=>{
        if ((err1)) {
            if ( (cb instanceof Function)) {
                return cb(err1);
            } else {
                return console.error(err1);
            }
        }
        doRemoveFile(file.path, (err)=>{
            if ((err)) {
                if ( (cb instanceof Function)) {
                    return cb(err);
                } else {
                    return console.error(err);
                }
            }
            file.remove(cb);
        });
    });
}

function commitFile(file, cb) { // Товарищ! Помни! Отсутствие транзакций -- убивает! :'-(
    if (typeof file === 'string') {
        File.getByURL(file, (err, nfile) => {
            if ((!err) && (nfile)) {
                return nfile.commit(cb);
            }
            if (!err) {
                err = 'File not found!';
            }
            return cb(err);
        } );
    } else {
        file.dbo.commit( err => {
            if ((err)) {
                if ( (cb instanceof Function)) {
                    return cb(err);
                } else {
                    return console.error(err);
                }
            }
        });
    }
}

function preAdd(fname) {
    return uploader.single(fname);
}

function removeListOfFiles(files) {
    if (!files) {
        return;
    }
    if (!(files instanceof Array)) {
        files = [files];
    }
    files.forEach( f => {
        doRemoveFile(f.path, (err1)=>{
            if (err1) {
                return console.error(err1);
            }
            f.remove((err2)=>{
                if (err2) {
                    return console.error(err2);
                }
            });
        });
    });
}

function collectRemoving() {
    File.getRemoving((err, files)=>{
        if (err) {
            return console.error(err);
        }
        removeListOfFiles(files);
    });
}

function collectNotCommited() {
    var t = Date.now() - conf.get('storage:commitTimeout') * 1000;
    File.getNotCommited(t, (err, files)=>{
        if (err) {
            return console.error(err);
        }
        removeListOfFiles(files);
    });
}

function garbageCollector() {
    collectRemoving();
    collectNotCommited();
    //TODO: collect files on fs without db record (very slow)
}

(function () {
    /*eslint-disable no-implicit-coercion */
    var dt = +(conf.get('storage:gcInterval'));
    if (typeof dt !== 'number') {
        dt = 6;
    }
    if (dt < 1) {
        dt = 1;
    }
    dt *= 1000 * 60 * 60;
    setInterval( garbageCollector, dt );
})();

// eslint-disable-next-line no-unused-vars
function uploadImage(req, res, next) {

    if (req.file) {
        res.status(200).json({status: 'OK', image: req.file.url});
    } else {
        res.status(400).json({status: 'File not found'});
    }
}

// eslint-disable-next-line no-unused-vars
function makeSnapshot(req, res, next) {
    var basename = Date.now() + '.' + snapFormat;
    // console.log('body', req.body);
    var ret = Uploader.genFilePath(req.user.displayName, basename);
    ret.target = req.body.url;
    ret.owner = req.user;

    mkdirp(ret.path, (err) => {
        if (err) {
            return next(err);
        }
        ret.path = ret.fullpath;
        addFile(ret, (err1)=>{
            if (err1) {
                return next(err1);
            }
            res.json({status: 'OK', attachment: ret.url});

            createSnapshot(req.body.url, ret.fullpath, (err2, title)=>{
                if (err2) {
                    return console.log('Error:', err2);
                }
                ret.dbo.title = title;
                ret.dbo.save( (err3)=>{
                    if (err3) {
                        return console.log('Error3:', err3);
                    }
                    Tweet.findOne({
                        'extras.attachment.title': null,
                        'extras.attachment.url': ret.target
                    }).exec((err4, tw)=>{
                        if (err4) {
                            return console.log('Error4:', err4);
                        }
                        if (tw) {
                            tw.extras.attachment.title = title;
                            tw.save((err5)=>{
                                return console.log('Error5:', err5);
                            });
                        }
                    });
                } );
            } );
        });

    });

}

function getSnapshot(req, res, next) {
    var cycles = 10;
    function reporter() {
        File.getByURL('/' + req.params.url, function (err, file) {
            if (err) {
                return next(err);
            }
            if (!file) {
                return res.status(404).json({status: 'File not found'});
            }
            if (file.title) {
                res.json({
                    status: 'OK',
                    attachment: {
                        url: file.target,
                        image: file.url,
                        title: file.title
                    }
                });
            } else {
                if (cycles > 0) {     // костыли костылёзные, но некогда писать на ивентах, но я обещаю, что перепишу
                    cycles--;
                    setTimeout(reporter, 1500);
                } else {
                    removeFile(file.url);
                    res.json({status: 'UnSuccessful'});
                }
            }
        });

    }
    reporter();
}

module.exports = {
    getSnapshot,
    uploadImage,
    makeSnapshot,
    commitFile,
    preAdd,
    removeFile
};
