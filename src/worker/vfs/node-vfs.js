import { VirtualFs } from './virtual-fs';
import * as Path from './path';

import { Buffer } from 'buffer';
import errors from 'errno';
import stream from 'readable-stream';



function VirtualFileSystemError(err, path) {
  Error.call(this, err.description);
  /*
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, VirtualFileSystemError);
  }
  */
  this.code = err.code;
  this.errno = err.errno;
  this.path = path;
}

const VirtualFileSystemError_prototype = Object.create(Error.prototype);
VirtualFileSystemError_prototype.name = "VirtualFileSystemError";
VirtualFileSystemError.prototype = VirtualFileSystemError_prototype;

// We manipulate prototype in the old way, so not using class here
export function VirtualNodeFs(process, vfs = new VirtualFs()) {
  this._vfs = vfs;
  this._process = process;

  [
    "ReadStream", "WriteStream", "join", "normalize"
  ].forEach(v => { this[v] = this[v]; });
  [
    "existsSync" ,"statSync", "readFileSync", "readdirSync", "mkdirpSync","mkdirSync", "rmdirSync", "unlinkSync", "readlinkSync", "writeFileSync",
    "createReadStream", "createWriteStream",


    "stat", "readdir", "mkdirp", "mkdir", "rmdir", "unlink", "readlink",
    "exists", "readFile", "writeFile"
  ].forEach(k => { this[k] = this[k].bind(this); });
}

const VirtualNodeFs_prototype = VirtualNodeFs.prototype;

VirtualNodeFs_prototype.ReadStream = stream.Readable;
VirtualNodeFs_prototype.WriteStream = stream.Writable;

function fn_false() { return false; }
function fn_true() { return true; }

VirtualNodeFs_prototype.existsSync = function existsSync(path) {
  return this._vfs.itemExists(this._process.cwd(), path);
};

VirtualNodeFs_prototype.statSync = function statSync(path) {
  const item = this._vfs.getItem(this._process.cwd(), path, false);
  if (item) {
    const type = item.type;
    return {
      isFile: type === 'file' ? fn_true : fn_false,
      isDirectory: type === 'directory' ? fn_true : fn_false,
      isBlockDevice: fn_false,
      isCharacterDevice: fn_false,
      isSymbolicLink: fn_false,
      isFIFO: fn_false,
      isSocket: fn_false
    };
  }
  throw new VirtualFileSystemError(errors.code.ENOENT, path);
};


VirtualNodeFs_prototype.readFileSync = function readFileSync(path, encoding) {
  var item = null;
  try {
    item = this._vfs.getItem(this._process.cwd(), path, true);
  } catch (_) {}
  if (item) {
    switch (item.type) {
      case 'directory':
        throw new VirtualFileSystemError(errors.code.EISDIR, path);
      case 'file':
        const data = new Buffer(item.contents);
        return encoding ? data.toString(encoding) : data;
    }
  }
  throw new VirtualFileSystemError(errors.code.ENOENT, path);
};

VirtualNodeFs_prototype.readdirSync  = function readdirSync(path) {
  var item = null;
  try {
    item = this._vfs.getItem(this._process.cwd(), path, true);
  } catch (_) {}
  if (item) {
    if (item.type === 'directory') {
      return item.getItems().map(x => x.name);
    } else {
      throw new VirtualFileSystemError(errors.code.ENOTDIR, path);
    }
  }
  throw new VirtualFileSystemError(errors.code.ENOENT, path);
};


VirtualNodeFs_prototype.mkdirpSync = function mkdirpSync(path) {
  try {
    this._vfs.mkdir(this._process.cwd(), path);
  } catch(_) {
    throw new VirtualFileSystemError(errors.code.ENOTDIR, path);
  }
};

VirtualNodeFs_prototype.mkdirSync = function mkdirSync(path) {
  var parent = null;
  const parent_path = Path.getParent(path);
  const dirname = Path.getFileName(path);
  var item = null;
  if (parent_path === path) {
    // it's the "/" root dir
    throw new VirtualFileSystemError(errors.code.EEXIST, path);
  } else {
    try {
      parent = this._vfs.getItem(this._process.cwd(), parent_path, true);
    } catch(_) {
      throw new VirtualFileSystemError(errors.code.ENOENT, path);
    }
    item = parent.getItem(dirname);
    if (item) {
      if (item.type === 'directory') {
        throw new VirtualFileSystemError(errors.code.EEXIST, path);
      } else {
        throw new VirtualFileSystemError(errors.code.ENOTDIR, path);
      }
    } else {
      this._vfs.createDirectory(parent, dirname);
    }
  }
};

VirtualNodeFs_prototype._remove = function _remove(path, fn_test) {
  const name = Path.getFileName(path);
  const ppath = Path.getParent(path);
  const cwd = this._process.cwd();
  if (Path.resolve(cwd, path) === Path.resolve(cwd, ppath)) {
    // it is root directory
    throw new VirtualFileSystemError(errors.code.EPERM, path);
  }
  var parent = null;
  try {
    parent = this._vfs.getDirectory(this._process.cwd(), ppath, true);
  } catch (_) {
    throw new VirtualFileSystemError(errors.code.ENOENT, path);
  }
  const item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(errors.code.ENOENT, path);
  }

  if (!fn_test || fn_test(item)) {
    parent.removeItem(name);
  }
};

VirtualNodeFs_prototype.rmdirSync = function rmdirSync(path) {
  this._remove(path, i => i.type === 'directory');
};

VirtualNodeFs_prototype.unlinkSync  = function unlinkSync (path) {
  this._remove(path, i => i.type === 'file');
};

VirtualNodeFs_prototype.readlinkSync = function readlinkSync (path) {
  throw new VirtualFileSystemError(errors.code.ENOSYS, path);
};

VirtualNodeFs_prototype.writeFileSync = function writeFileSync(path, content, encoding) {
  if(!content && !encoding) throw new Error("No content");
  const name = Path.getFileName(path);
  const ppath = Path.getParent(path);
  const cwd = this._process.cwd();

  var parent = null;
  try {
    parent = this._vfs.getDirectory(cwd, path, true);
  } catch (_) {
    throw new VirtualFileSystemError(errors.code.ENOENT, path);
  }
  const item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(errors.code.ENOENT, path);
  }
  if (item.type !== 'file') {
    // TODO: throwing isdir when !isfile?
    throw new VirtualFileSystemError(errors.code.EISDIR, path);
  }
  const buffer = encoding || typeof content === "string" ? new Buffer(content, encoding) : content;
  item.content = toArrayBuffer(buffer);
};

function toArrayBuffer(buffer) {
  var view = new Uint8Array(buffer.length);
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return view;
}

VirtualNodeFs_prototype.join = Path.combine;
VirtualNodeFs_prototype.normalize = Path.normalize;




// stream functions

VirtualNodeFs_prototype.createReadStream = function(path, options) {
  var stream = new stream.Readable();
  var done = false;
  var data;
  try {
    data = this.readFileSync(path);
  } catch (e) {
    stream._read = function() {
      if (!done) {
        done = true;
        this.emit('error', e);
        this.push(null);
      }
    };
    return stream;
  }
  options = options || { };
  options.start = options.start || 0;
  options.end = options.end || data.length;
  stream._read = function() {
    if (!done) {
      done = true;
      this.push(data.slice(options.start, options.end));
      this.push(null);
    }
  };
  return stream;
};

VirtualNodeFs_prototype.createWriteStream = function(path, options) {
  var stream = new stream.Writable(), _this = this;
  try {
    // Zero the file and make sure it is writable
    this.writeFileSync(path, new Buffer(0));
  } catch(e) {
    // This or setImmediate?
    stream.once('prefinish', function() {
      stream.emit('error', e);
    });
    return stream;
  }
  var bl = [ ], len = 0;
  stream._write = function(chunk, encoding, callback) {
    bl.push(chunk);
    len += chunk.length;
    _this.writeFile(path, Buffer.concat(bl, len), callback);
  };
  return stream;
};

function later(fn) {
  setTimeout(() => { fn(); }, 0);
}

[
  "stat", "readdir", "mkdirp", "mkdir", "rmdir", "unlink", "readlink",
  "exists", "readFile", "writeFile"
].forEach(fname => {
  const sname = fname + "Sync";

  VirtualNodeFs_prototype[fname] = function(...args) {
    const callback = args.pop();
    later(() => {
      var result = null;
      var succeeded = false;
      try {
        result = this[sname](...args);
        succeeded = true;
      } catch (e) {
        callback(e);
      }
      if (succeeded) {
        callback(null, result);
      }
    });
  };
});





