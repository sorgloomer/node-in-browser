
export const worker = new Worker('bundle-worker.js');

export function run(code) {
  worker.postMessage({ command: 'eval', value: code });
}

run(`
  var fs = require('fs');
  var text = fs.loadText('/common/node_modules/npm/package.json');
  console.log(text);
`);

