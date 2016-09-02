'use strict';

const forker = require('child_process').execFile;
const conf = require('../conf');
const path = require('path');
const encoder = conf.get('snapshotEngineCmd') || 'wkhtmltoimage';

function textEscapeForRE(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\n|\r|\n\r|\r\n/g, '');
}

var goodSrc = /^https?:\/\/([a-z0-9_-]+)(\.([a-z0-9_-]+))+\/?/i;
var dir = '^' + textEscapeForRE( conf.get('storage:dir') + path.sep );

var goodDst = new RegExp( dir, 'i');

function createSnapshot(src, dst, cb) {
    if (!(goodSrc.test(src)) ) {
        throw new Error('Source for image should be a url:' + src);
    }
    if (!(goodDst.test(dst)) ) {
        throw new Error('Wrong destination for image:' + dir + ' <> ' + dst);
    }
    if (!(cb instanceof Function)) {
        throw new Error('Callback should be a function');
    }
    forker(encoder, [src, dst], {timeout: 10000}, (error, stdout, stderr)=>{
        if (error) {
            console.error('Error was catched while converting to image: \n', error);
            console.log('', stdout);
            console.log('', stderr);
        }
        cb(error, 'Title');
    });
}

module.exports = createSnapshot;
