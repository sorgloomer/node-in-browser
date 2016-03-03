import { NodeScope } from './lib/modules/NodeScope';

(new NodeScope()).eval(`

var fs = require('fs');
fs.storeText('./mymodule.js', "console.log('p mymodule');");

console.log('p main #1');
require('./mymodule');
console.log('p main #2');

`);