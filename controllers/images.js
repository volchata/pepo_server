'use strict';

var File = require('../models/file');
var uploader = require('../libs/fileUploader').create( addFile );
const fs = require('fs');
var conf = require('../conf');

function addFile(file, cb) {
    var f = new File( {path: file.path, url: file.url} );
    // console.log('Here im', file);
    f.save((err)=>{
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

    File.setToRemoveByURL(url, (err, file)=>{
        if (err) {
            return console.error(err);
        }
        doRemoveFile(file.path, (err)=>{
            if (err) {
                return console.error(err);
            }
            file.remove(cb);
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
    preAdd,
    removeFile
};
