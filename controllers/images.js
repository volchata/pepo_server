'use strict';

var File = require('../models/file');
var uploader = require('../libs/fileUploader').create( addFile );
const fs = require('fs');
var conf = require('../conf');

function logger(err) {
    if (err) {
        console.error(err);
    }
}

function addFile(file, cb) {
    var f = new File( {path: file.path, url: file.url} );
    // console.log('file', file);
    if (file.owner.fileBuffer && file.owner.fileBuffer.length) {
        removeFile(file.owner.fileBuffer, logger);
    }
    file.owner.fileBuffer = file.url;
    file.owner.save( (err1) =>{
        logger(err1);
        if ((err1) && (cb instanceof Function)) {
            return cb(err1);
        }
        f.save((err)=>{
            logger(err);
            file.dbo = f;
            if (cb instanceof Function) {
                cb(err);
            }
        });
    } );

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
    file.owner.freeBuffer( err1 => {
        if ((err1)) {
            if ( (cb instanceof Function)) { // какая то фигня с колбеками. Промисы forever!
                return cb(err1);
            } else {
                return console.error(err1);
            }
        }
        file.dbo.commit( err => {
            if ((err)) {
                if ( (cb instanceof Function)) {
                    return cb(err);
                } else {
                    return console.error(err);
                }
            }
        });
    });

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

module.exports = {
    commitFile,
    preAdd,
    removeFile
};
