'use strict';

const forker = require('child_process').execFile;
const conf = require('../conf');
const path = require('path');
const encoder = conf.get('snapshotEngineCmd') || 'wkhtmltoimage';
const opts = conf.get('snapshotEngineOpts') || [];
const titleExtractor = path.join( process.cwd(), 'libs', 'titleExtractor.sh' );

function textEscapeForRE(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&').replace(/\n|\r|\n\r|\r\n/g, '');
}

var goodSrc = /^https?:\/\/([a-z0-9_-]+)(\.([a-z0-9_-]+))+\/?/i;
var dir = '^' + textEscapeForRE( conf.get('storage:dir') + path.sep );

var goodDst = new RegExp( dir, 'i');

function createSnapshot(src, dst, cb) {
    var title;
    var imageReady;
    function aggregator(error, stdout, stderr) {
        if (error) {
            console.error('Error was catched while converting to image: \n', error);
            console.log('', stdout);
            console.log('', stderr);
        }
        if ((title) && (imageReady)) {
            cb(error, title);
        }
    }
    if (!(goodSrc.test(src)) ) {
        // throw new Error('Source for image should be a url:' + src);
        src = 'http://' + src;
    }
    if (!(goodDst.test(dst)) ) {
        throw new Error('Wrong destination for image:' + dir + ' <> ' + dst);
    }
    if (!(cb instanceof Function)) {
        throw new Error('Callback should be a function');
    }
    forker(encoder, opts.concat(src, dst), {timeout: 30000}, (error, stdout, stderr)=>{
        imageReady = true;
        aggregator(error, stdout, stderr);
    });
    forker(titleExtractor, [src], {timeout: 10000}, (error, stdout, stderr)=>{
        if (!error) {
            title = stdout;
        }
        aggregator(error, stdout, stderr);
    });

}

module.exports = createSnapshot;
