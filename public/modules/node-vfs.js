'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualNodeFs = VirtualNodeFs;

var _buffer = require('buffer');

var _buffer2 = _interopRequireDefault(_buffer);

var _stream = require('stream');

var _stream2 = _interopRequireDefault(_stream);

var _errno = require('errno');

var _errno2 = _interopRequireDefault(_errno);

var _vfs_path = require('vfs_path');

var path = _interopRequireWildcard(_vfs_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

var VirtualFileSystemError_prototype = Object.create(Error.prototype);
VirtualFileSystemError_prototype.name = "VirtualFileSystemError";
VirtualFileSystemError.prototype = VirtualFileSystemError_prototype;

// We manipulate prototype in the old way, so not using class here
function VirtualNodeFs(process, vfs) {
  var _this = this;

  this._vfs = vfs;
  this._process = process;
  this._buffer = _buffer2.default;
  this._stream = _stream2.default;
  this._errno = _errno2.default;
  this._path = path;

  this.ReadStream = _stream2.default.Readable;
  this.WriteStream = _stream2.default.Writable;
  this.join = path.combine;
  this.normalize = path.normalize;

  ["existsSync", "statSync", "readFileSync", "readdirSync", "mkdirpSync", "mkdirSync", "rmdirSync", "unlinkSync", "readlinkSync", "writeFileSync", "createReadStream", "createWriteStream", "stat", "readdir", "mkdirp", "mkdir", "rmdir", "unlink", "readlink", "exists", "readFile", "writeFile"].forEach(function (k) {
    _this[k] = _this[k].bind(_this);
  });
}

var VirtualNodeFs_prototype = VirtualNodeFs.prototype;

function fn_false() {
  return false;
}
function fn_true() {
  return true;
}

VirtualNodeFs_prototype.existsSync = function existsSync(path) {
  return this._vfs.itemExists(this._process.cwd(), path);
};

VirtualNodeFs_prototype.statSync = function statSync(path) {
  var item = this._vfs.getItem(this._process.cwd(), path, false);
  if (item) {
    var type = item.type;
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
  throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
};

VirtualNodeFs_prototype.readFileSync = function readFileSync(path, encoding) {
  var Buffer = this._buffer.Buffer;
  var item = null;
  try {
    item = this._vfs.getItem(this._process.cwd(), path, true);
  } catch (_) {}
  if (item) {
    switch (item.type) {
      case 'directory':
        throw new VirtualFileSystemError(this._errno.code.EISDIR, path);
      case 'file':
        var data = new Buffer(this._vfs.getContentOfAs(item, 'bytes'));
        return encoding ? data.toString(encoding) : data;
    }
  }
  throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
};

VirtualNodeFs_prototype.readdirSync = function readdirSync(path) {
  var item = null;
  try {
    item = this._vfs.getItem(this._process.cwd(), path, true);
  } catch (_) {}
  if (item) {
    if (item.type === 'directory') {
      return item.getItems().map(function (x) {
        return x.name;
      });
    } else {
      throw new VirtualFileSystemError(this._errno.code.ENOTDIR, path);
    }
  }
  throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
};

VirtualNodeFs_prototype.mkdirpSync = function mkdirpSync(path) {
  try {
    this._vfs.mkdir(this._process.cwd(), path);
  } catch (_) {
    throw new VirtualFileSystemError(this._errno.code.ENOTDIR, path);
  }
};

VirtualNodeFs_prototype.mkdirSync = function mkdirSync(path) {
  var parent = null;
  var parent_path = this._path.getParent(path);
  var dirname = this._path.getFileName(path);
  var item = null;
  if (parent_path === path) {
    // it's the "/" root dir
    throw new VirtualFileSystemError(this._errno.code.EEXIST, path);
  } else {
    try {
      parent = this._vfs.getItem(this._process.cwd(), parent_path, true);
    } catch (_) {
      throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
    }
    item = parent.getItem(dirname);
    if (item) {
      if (item.type === 'directory') {
        throw new VirtualFileSystemError(this._errno.code.EEXIST, path);
      } else {
        throw new VirtualFileSystemError(this._errno.code.ENOTDIR, path);
      }
    } else {
      this._vfs.createDirectory(parent, dirname);
    }
  }
};

VirtualNodeFs_prototype._remove = function _remove(path, fn_test) {
  var name = this._path.getFileName(path);
  var parent_path = this._path.getParent(path);
  var cwd = this._process.cwd();
  if (this._path.resolve(cwd, path) === this._path.resolve(cwd, parent_path)) {
    // it is root directory
    throw new VirtualFileSystemError(this._errno.code.EPERM, path);
  }
  var parent = null;
  try {
    parent = this._vfs.getDirectory(this._process.cwd(), parent_path, true);
  } catch (_) {
    throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
  }
  var item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
  }

  if (!fn_test || fn_test(item)) {
    parent.removeItem(name);
  }
};

VirtualNodeFs_prototype.rmdirSync = function rmdirSync(path) {
  this._remove(path, function (i) {
    return i.type === 'directory';
  });
};

VirtualNodeFs_prototype.unlinkSync = function unlinkSync(path) {
  this._remove(path, function (i) {
    return i.type === 'file';
  });
};

VirtualNodeFs_prototype.readlinkSync = function readlinkSync(path) {
  throw new VirtualFileSystemError(this._errno.code.ENOSYS, path);
};

VirtualNodeFs_prototype.writeFileSync = function writeFileSync(path, content, encoding) {
  var Buffer = this._buffer.Buffer;

  if (!content && !encoding) throw new Error("No content");
  var name = this._path.getFileName(path);
  var parent_path = this._path.getParent(path);
  var cwd = this._process.cwd();

  var parent = null;
  try {
    parent = this._vfs.getDirectory(cwd, parent_path, true);
  } catch (_) {
    throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
  }
  var item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(this._errno.code.ENOENT, path);
  }
  if (item.type !== 'file') {
    // TODO: throwing isdir when !isfile?
    throw new VirtualFileSystemError(this._errno.code.EISDIR, path);
  }
  var buffer = encoding || typeof content === "string" ? new Buffer(content, encoding) : content;
  item.content = toArrayBuffer(buffer);
};

function toArrayBuffer(buffer) {
  var view = new Uint8Array(buffer.length);
  for (var i = 0; i < buffer.length; ++i) {
    view[i] = buffer[i];
  }
  return view;
}

// stream functions

VirtualNodeFs_prototype.createReadStream = function (path, options) {
  var stream = new this.ReadStream();
  var done = false;
  var data;
  try {
    data = this.readFileSync(path);
  } catch (e) {
    stream._read = function () {
      if (!done) {
        done = true;
        this.emit('error', e);
        this.push(null);
      }
    };
    return stream;
  }
  options = options || {};
  options.start = options.start || 0;
  options.end = options.end || data.length;
  stream._read = function () {
    if (!done) {
      done = true;
      this.push(data.slice(options.start, options.end));
      this.push(null);
    }
  };
  return stream;
};

VirtualNodeFs_prototype.createWriteStream = function (path, options) {
  var _this2 = this;

  var stream = new this.WriteStream();
  var Buffer = this._buffer.Buffer;

  try {
    // Zero the file and make sure it is writable
    this.writeFileSync(path, new Buffer(0));
  } catch (e) {
    // This or setImmediate?
    stream.once('prefinish', function () {
      stream.emit('error', e);
    });
    return stream;
  }
  var bl = [],
      len = 0;
  stream._write = function (chunk, encoding, callback) {
    bl.push(chunk);
    len += chunk.length;
    _this2.writeFile(path, Buffer.concat(bl, len), callback);
  };
  return stream;
};

function later(fn) {
  setTimeout(function () {
    fn();
  }, 0);
}

["stat", "readdir", "mkdirp", "mkdir", "rmdir", "unlink", "readlink", "exists", "readFile", "writeFile"].forEach(function (fname) {
  var sname = fname + "Sync";

  VirtualNodeFs_prototype[fname] = function () {
    var _this3 = this;

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var callback = args.pop();
    later(function () {
      var result = null;
      var succeeded = false;
      try {
        result = _this3[sname].apply(_this3, args);
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
