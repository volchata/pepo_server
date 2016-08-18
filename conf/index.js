'use strict';

var nconf = require('nconf');
var path = require('path');

nconf.argv()
    .env()
    .file('custom', {type: 'file', file: path.join(__dirname, '/conf_secured.json')})
    .add('file', {type: 'file', file: path.join(__dirname, '/conf.json')});

module.exports = nconf;
