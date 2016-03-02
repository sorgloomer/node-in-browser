import path from './path';

function firstNotNull(arr, fn) {
  var found = false, result = null;
  Array.prototype.forEach.call(arr, function(x) {
    if (!found) {
      var loc = fn(x);
      if (loc !== null) {
        found = true;
        result = loc;
      }
    }
  });
  return result;
}

export class ModuleResolver {
  constructor(fs) {
    this.fs = fs;
    this.roots = ['./node_modules', '/node/modules'];
    this.extension = '.js';
  }

  findModuleFile(moduleName) {
    const relativeModule = /^[\.\\\/]/.test(moduleName);

    if (relativeModule) {
      const hasExt = ('' + moduleName).endsWith(this.extension);
      return hasExt ? moduleName : moduleName + this.extension;
    } else {
      return firstNotNull(this.roots, function(root) {
        var absolute = path.normalize(path.combine(root, moduleName));
        return this.fs.exists(absolute) ? absolute : null;
      });
    }
  }

}