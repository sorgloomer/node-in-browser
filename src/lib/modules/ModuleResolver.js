import VirtualPath from '../vfs/VirtualPath';

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

  resolveFileModule(cwd, moduleName) {
    const hasExt = ('' + moduleName).endsWith(this.extension);
    const fileName = VirtualPath.resolve(cwd, hasExt ? moduleName : moduleName + this.extension);
    return this.fs.exists(fileName) ? fileName : null;
  }

  resolveNodeModule(cwd, moduleName) {
    return firstNotNull(this.roots, function(root) {
      var absolute = VirtualPath.normalize(VirtualPath.combine(root, moduleName));
      return this.fs.existsSync(absolute) ? absolute : null;
    });
  }

  normalize(cwd, moduleName) {
    const localModule = VirtualPath.isRelativeOrAbsolute(moduleName);
    if (localModule) {
      return VirtualPath.resolve(cwd, moduleName);
    } else {
      return VirtualPath.normalize(moduleName);
    }
  }

  findModuleFile(cwd, moduleName) {
    const localModule = VirtualPath.isRelativeOrAbsolute(moduleName);
    if (localModule) {
      return this.resolveFileModule(cwd, moduleName);
    } else {
      return this.resolveNodeModule(cwd, moduleName);
    }
  }

}