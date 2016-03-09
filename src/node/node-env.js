
var buffer = require('buffer');
var path = require('path');
var http = require('http-browserify');
var https = require('https-browserify');
var npm = require('npm');

var MemoryFs = require('memory-fs');
var NodeContainer = require('./node-container.js');

module.exports = function() {
    var fs = new MemoryFs();
    return new NodeContainer(fs, [
        new Module('fs', fs),
        new Module('buffer', buffer),
        new Module('path', path),
        new Module('http', http),
        new Module('https', https),

        new Module('npm', npm)
    ]);
};
