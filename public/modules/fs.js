'use strict';

var NodeVfs = require('node-vfs').VirtualNodeFs;
var binding = process.binding;
module.exports = new NodeVfs(process, binding.vfs);
