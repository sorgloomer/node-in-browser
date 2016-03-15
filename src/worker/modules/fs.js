
const NodeVfs = require('node-vfs').VirtualNodeFs;
const binding = process.binding;
module.exports = new NodeVfs(process, binding.vfs);
