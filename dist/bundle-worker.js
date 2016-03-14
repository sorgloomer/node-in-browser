(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _nodeEnv = require('./node-env');

var _nodeEnv2 = _interopRequireDefault(_nodeEnv);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Hack to make shitty implementations relying on window work....
self.window = self;

var worker = self;

var container = (0, _nodeEnv2.default)();
var commands = commandify();
subscribe(commands);

function commandify() {
    return {
        eval: function _eval(value) {
            return container.eval(value);
        },
        eval_lines: function eval_lines(value) {
            return container.eval_lines(value);
        },
        ping: function ping() {
            return 'pong';
        },
        reset: function reset() {
            container = (0, _nodeEnv2.default)();
        }
    };
}

function subscribe(commands) {
    worker.onmessage = function (_ref) {
        var _ref$data = _ref.data;
        var type = _ref$data.type;
        var token = _ref$data.token;
        var value = _ref$data.value;

        try {
            var res = commands[type](value);
            worker.postMessage({
                type: 'resolve', token: token, value: res
            });
        } catch (e) {
            worker.postMessage({
                type: 'reject', token: token, value: '' + e
            });
            throw e;
        }
    };
}

},{"./node-env":3}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.NodeContainer = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.Module = Module;

var _path = require("../vfs/path");

var Path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _is_module_local(module_name) {
    return (/^(?:|[a-zA-Z0-9]+:|\.|\.\.)(?:\\|\/|$)/.test(module_name)
    );
}

function Module(name, directory) {
    var exports = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    this.name = name;
    this.filename = "TODO"; // TODO
    this.directory = directory;
    this.exports = exports;
    this._require_path = "";
}

var NodeContainer = exports.NodeContainer = function () {
    function NodeContainer(vfs, cwd, modules) {
        var redirects = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

        _classCallCheck(this, NodeContainer);

        this.vfs = vfs;
        this.redirects = redirects;
        this.modules = new Map(modules.map(function (x) {
            return [x.name, x];
        }));
        this.main_module = new Module('main', cwd);
    }

    _createClass(NodeContainer, [{
        key: "require_by_parent",
        value: function require_by_parent(module_name, parent_module) {
            var module = this.require_module(parent_module, module_name);
            if (!module) throw new Error('Cannot find module: ' + module_name + " <- " + parent_module._require_path);
            return module.exports;
        }
    }, {
        key: "_getSource",
        value: function _getSource(file) {
            return this.vfs.getContentText("/", file);
        }
    }, {
        key: "require",
        value: function require(module_name) {
            return this.require_by_parent(module_name, this.main_module);
        }
    }, {
        key: "_attempt_load_file",
        value: function _attempt_load_file(parent_module, module_name, real_file_name, module_id) {
            var temp = this.modules.get(module_id);
            if (temp) return temp;

            var source = this._getSource(real_file_name);
            if (source === null) return null;
            var module = new Module(module_id, Path.getParent(real_file_name));
            module._require_path = module_name + " <- " + parent_module._require_path;
            this.modules.set(module_id, module);

            try {
                if (Path.getExt(real_file_name) === '.json') {
                    module.exports = JSON.parse(source);
                } else {
                    this._eval_module(module, source);
                }
            } catch (e) {
                this.modules.delete(module_id);
                throw e;
            }
            return module;
        }
    }, {
        key: "_require_module_local",
        value: function _require_module_local(parent_module, module_name) {
            var file_name = Path.resolve(parent_module.directory, module_name);
            var result = this._attempt_load_file(parent_module, module_name, file_name, file_name);
            if (!result && !Path.getExt(file_name)) {
                result = this._attempt_load_file(parent_module, module_name, file_name + '.js', file_name + '.js');
            }
            return result;
        }
    }, {
        key: "_require_module_node_single",
        value: function _require_module_node_single(parent_module, module_name, absolute_module_id) {
            absolute_module_id = Path.normalize(absolute_module_id);
            var result = this._attempt_load_file(parent_module, module_name, absolute_module_id, absolute_module_id);
            if (result) return result;
            result = this._attempt_load_file(parent_module, module_name, absolute_module_id + '.js', absolute_module_id);
            if (result) return result;
            result = this._attempt_load_file(parent_module, module_name, Path.resolve(absolute_module_id, 'index.js'), absolute_module_id);
            if (result) return result;
            var json_file_name = Path.resolve(absolute_module_id, 'package.json');
            var source = this._getSource(json_file_name);
            if (source === null) return null;
            var package_data = JSON.parse(source);
            var real_file_name = typeof package_data.browser === "string" ? package_data.browser : package_data.main;
            result = this._attempt_load_file(parent_module, module_name, Path.resolve(absolute_module_id, real_file_name), absolute_module_id);
            if (result) return result;
            return result;
        }
    }, {
        key: "_require_module_node",
        value: function _require_module_node(parent_module, module_name) {
            if (this.redirects && Object.prototype.hasOwnProperty.call(this.redirects, module_name)) {
                var redirect = this.redirects[module_name];
                return this._require_module_node_single(parent_module, module_name, redirect);
            } else {
                var temp = this.modules.get(module_name);
                if (temp) return temp;
                var search = parent_module.directory;
                for (;;) {
                    var file_candidate = Path.resolve(search, 'node_modules', module_name);
                    temp = this._require_module_node_single(parent_module, module_name, file_candidate);
                    if (temp) return temp;
                    var temp_search = Path.getParent(search);
                    if (temp_search === search) return null;
                    search = temp_search;
                }
            }
        }
    }, {
        key: "require_module",
        value: function require_module(parent_module, module_name) {
            if (_is_module_local(module_name)) {
                return this._require_module_local(parent_module, module_name);
            } else {
                return this._require_module_node(parent_module, module_name);
            }
        }
    }, {
        key: "_eval_module",
        value: function _eval_module(module_obj, code) {
            return new Function('require', 'module', 'exports', '__filename', '__dirname', code)(this._make_require(module_obj), module_obj, module_obj.exports, module_obj.filename, module_obj.directory);
        }
    }, {
        key: "_make_require",
        value: function _make_require(module_obj) {
            var _this = this;
            return function require(module_name) {
                return _this.require_by_parent(module_name, module_obj);
            };
        }
    }, {
        key: "eval_lines",
        value: function eval_lines(code) {
            return this._eval_module(this.main_module, code);
        }
    }, {
        key: "eval",
        value: function _eval(code) {
            return this.eval_lines("return " + code);
        }
    }]);

    return NodeContainer;
}();

},{"../vfs/path":8}],3:[function(require,module,exports){
(function (process){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _nodeVfs = require("../vfs/node-vfs");

var _virtualFs = require("../vfs/virtual-fs");

var _httpFs = require("../vfs/http-fs");

var _path = require("../vfs/path");

var Path = _interopRequireWildcard(_path);

var _nodeContainer = require("./node-container");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var INITIAL_FOLDER_NAME = "home";
var INITIAL_FOLDER = "/" + INITIAL_FOLDER_NAME;
var EXECUTABLE = "/bin/node";

function patch_process(_process, stream) {
    var cwd = INITIAL_FOLDER;
    _process.stdin = new stream.Readable();
    _process.stdout = ostream(stream, "stdout:");
    _process.stderr = ostream(stream, "stderr:");
    _process.argv = [EXECUTABLE];
    _process.cwd = function () {
        return cwd;
    };
    _process.chdir = function (d) {
        cwd = Path.resolve(cwd, d);
    };
}

function ostream(stream, prefix) {
    var result = new stream.Writable();
    result._write = function (chunk, encoding) {
        console.log(prefix + chunk.toString(encoding || 'utf-8'));
    };
    return result;
}

function initialize() {
    var vfs = new _virtualFs.VirtualFs(process);
    var httpDir = new _httpFs.HttpDirectory("/node_modules", "node_modules");
    vfs.root.setItem(httpDir);
    vfs.createDirectory(vfs.root, INITIAL_FOLDER_NAME);

    var module_fs = new _nodeVfs.VirtualNodeFs(process, vfs);

    var module_list = [["child_process", {}], ['fs', module_fs]].map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var name = _ref2[0];
        var exp = _ref2[1];
        return new _nodeContainer.Module(name, null, exp);
    });

    var R = "/node_modules/";
    var redirects = {
        "assert": R + "assert",
        "buffer": R + "buffer",
        "console": R + "console-browserify",
        "constants": R + "constants-browserify",
        "crypto": R + "crypto-browserify",
        "domain": R + "domain-browser",
        "events": R + "events",
        "http": R + "http-browserify",
        "https": R + "https-browserify",
        "os": R + "os-browserify",
        "path": R + "path-browserify",
        "punycode": R + "punycode",
        "querystring": R + "querystring",
        "stream": R + "stream-browserify",
        "string_decoder": R + "string_decoder",
        "timers": R + "timers-browserify",
        "tty": R + "tty-browserify",
        "url": R + "url",
        "util": R + "util",
        "vm": R + "vm-browserify",
        "zlib": R + "browserify-zlib"
    };

    // Hack browserify's objects into global scope
    var _process = process;
    self.global = self;
    self.process = _process;

    var container = new _nodeContainer.NodeContainer(vfs, INITIAL_FOLDER, module_list, redirects);
    self.Buffer = container.require("buffer").Buffer;
    var container_stream = container.require("stream");
    patch_process(_process, container_stream);
    return container;
}

exports.default = initialize;

}).call(this,require('_process'))
},{"../vfs/http-fs":5,"../vfs/node-vfs":7,"../vfs/path":8,"../vfs/virtual-fs":9,"./node-container":2,"_process":16}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.ascii_to_bytes = ascii_to_bytes;
exports.fetchBytesSync = fetchBytesSync;
exports.fetchSync = fetchSync;
exports.fetchJsonSync = fetchJsonSync;
function ascii_to_bytes(ascii) {
    var res = new Uint8Array(ascii.length);
    for (var i = 0; i < res.length; i++) {
        res[i] = ascii.charCodeAt(i);
    }
    return res;
}

function utf8_to_bytes(text) {
    var encoder = new TextEncoder("utf-8");
    return encoder.encode(text);
}

function fetchBytesSync(url) {
    // NOTE: It might not retrieve the exact bytes!!!
    // but this module is usually used to load sources,
    // so as long as the new bytes represent the same text
    // it will work normally
    return utf8_to_bytes(fetchSync(url));
}

function fetchSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send(null);
    var statusCode = xhr.status;
    if (statusCode >= 200 && statusCode < 300 || statusCode == 304) {
        return xhr.response;
    } else {
        throw new Error("HTTP " + statusCode + ": " + xhr.response);
    }
}

function fetchJsonSync(url) {
    return JSON.parse(fetchSync(url));
}

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HttpFile = exports.HttpDirectory = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fetchSync = require("./fetch-sync");

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DIR_SUFFIX = "/dir-listing";

function fetch_dir(root) {
  var items = new Map();
  var data = (0, _fetchSync.fetchJsonSync)(root + DIR_SUFFIX);
  data.files.forEach(function (f) {
    items.set(f, new HttpFile(root + "/" + f, f));
  });
  data.directories.forEach(function (f) {
    items.set(f, new HttpDirectory(root + "/" + f, f));
  });
  return items;
}

var HttpDirectory = exports.HttpDirectory = function () {
  function HttpDirectory(root_uri, name) {
    _classCallCheck(this, HttpDirectory);

    this.name = name;
    this.type = "directory";
    this._root_uri = root_uri;
    this._items = null;
  }

  _createClass(HttpDirectory, [{
    key: "_fetch",
    value: function _fetch() {
      return fetch_dir(this._root_uri);
    }
  }, {
    key: "getItem",
    value: function getItem(name) {
      return this.items.get(name) || null;
    }
  }, {
    key: "setItem",
    value: function setItem(item) {
      this.items.set(item.name, item);
    }
  }, {
    key: "removeItem",
    value: function removeItem(name) {
      this.items.delete(name);
    }
  }, {
    key: "getItems",
    value: function getItems() {
      return Array.from(this.items.values());
    }
  }, {
    key: "items",
    get: function get() {
      return this._items || (this._items = this._fetch());
    }
  }]);

  return HttpDirectory;
}();

var HttpFile = exports.HttpFile = function () {
  function HttpFile(root_uri, name) {
    _classCallCheck(this, HttpFile);

    this.name = name;
    this.type = "file";
    this._root_uri = root_uri;
    this._content = null;
  }

  _createClass(HttpFile, [{
    key: "_fetch",
    value: function _fetch() {
      return (0, _fetchSync.fetchSync)(this._root_uri);
    }
  }, {
    key: "content",
    get: function get() {
      return this._content || (this._content = this._fetch());
    },
    set: function set(value) {
      this._content = value;
    }
  }]);

  return HttpFile;
}();

},{"./fetch-sync":4}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MemoryDirectory = exports.MemoryDirectory = function () {
    function MemoryDirectory(name) {
        _classCallCheck(this, MemoryDirectory);

        this.name = name;
        this.type = "directory";
        this.items = new Map();
    }

    _createClass(MemoryDirectory, [{
        key: "getItem",
        value: function getItem(name, type) {
            if (type) console.warn("type used at MemoryDirectory.getItem");
            return this.items.get(name) || null;
        }
    }, {
        key: "getItems",
        value: function getItems() {
            return Array.from(this.items.values());
        }
    }, {
        key: "setItem",
        value: function setItem(item) {
            this.items.set(item.name, item);
        }
    }, {
        key: "removeItem",
        value: function removeItem(name) {
            this.items.delete(name);
        }
    }]);

    return MemoryDirectory;
}();

var MemoryFile = exports.MemoryFile = function MemoryFile(name, content) {
    _classCallCheck(this, MemoryFile);

    this.name = name;
    this.type = "file";
    this.content = content;
};

},{}],7:[function(require,module,exports){
(function (Buffer){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualNodeFs = VirtualNodeFs;

var _virtualFs = require('./virtual-fs');

var _path = require('./path');

var Path = _interopRequireWildcard(_path);

var _errno = require('errno');

var _errno2 = _interopRequireDefault(_errno);

var _buffer = require('buffer');

var _buffer2 = _interopRequireDefault(_buffer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

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
function VirtualNodeFs(process) {
  var _this2 = this;

  var vfs = arguments.length <= 1 || arguments[1] === undefined ? new _virtualFs.VirtualFs() : arguments[1];

  this._vfs = vfs;
  this._process = process;
  this._streams = null;
  this._buffer = _buffer2.default;

  ["ReadStream", "WriteStream", "join", "normalize"].forEach(function (v) {
    _this2[v] = _this2[v];
  });
  ["existsSync", "statSync", "readFileSync", "readdirSync", "mkdirpSync", "mkdirSync", "rmdirSync", "unlinkSync", "readlinkSync", "writeFileSync", "createReadStream", "createWriteStream", "stat", "readdir", "mkdirp", "mkdir", "rmdir", "unlink", "readlink", "exists", "readFile", "writeFile"].forEach(function (k) {
    _this2[k] = _this2[k].bind(_this2);
  });
}

var VirtualNodeFs_prototype = VirtualNodeFs.prototype;

VirtualNodeFs_prototype._set_streams = function (streams) {
  this._streams = streams;
  // TODO
  // this._buffer = buffer;
  this.ReadStream = streams.Readable;
  this.WriteStream = streams.Writable;
};

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
  throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
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
        throw new VirtualFileSystemError(_errno2.default.code.EISDIR, path);
      case 'file':
        var data = new Buffer(this._vfs.getContentOfAs(item, 'bytes'));
        return encoding ? data.toString(encoding) : data;
    }
  }
  throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
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
      throw new VirtualFileSystemError(_errno2.default.code.ENOTDIR, path);
    }
  }
  throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
};

VirtualNodeFs_prototype.mkdirpSync = function mkdirpSync(path) {
  try {
    this._vfs.mkdir(this._process.cwd(), path);
  } catch (_) {
    throw new VirtualFileSystemError(_errno2.default.code.ENOTDIR, path);
  }
};

VirtualNodeFs_prototype.mkdirSync = function mkdirSync(path) {
  var parent = null;
  var parent_path = Path.getParent(path);
  var dirname = Path.getFileName(path);
  var item = null;
  if (parent_path === path) {
    // it's the "/" root dir
    throw new VirtualFileSystemError(_errno2.default.code.EEXIST, path);
  } else {
    try {
      parent = this._vfs.getItem(this._process.cwd(), parent_path, true);
    } catch (_) {
      throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
    }
    item = parent.getItem(dirname);
    if (item) {
      if (item.type === 'directory') {
        throw new VirtualFileSystemError(_errno2.default.code.EEXIST, path);
      } else {
        throw new VirtualFileSystemError(_errno2.default.code.ENOTDIR, path);
      }
    } else {
      this._vfs.createDirectory(parent, dirname);
    }
  }
};

VirtualNodeFs_prototype._remove = function _remove(path, fn_test) {
  var name = Path.getFileName(path);
  var ppath = Path.getParent(path);
  var cwd = this._process.cwd();
  if (Path.resolve(cwd, path) === Path.resolve(cwd, ppath)) {
    // it is root directory
    throw new VirtualFileSystemError(_errno2.default.code.EPERM, path);
  }
  var parent = null;
  try {
    parent = this._vfs.getDirectory(this._process.cwd(), ppath, true);
  } catch (_) {
    throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
  }
  var item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
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
  throw new VirtualFileSystemError(_errno2.default.code.ENOSYS, path);
};

VirtualNodeFs_prototype.writeFileSync = function writeFileSync(path, content, encoding) {
  var Buffer = this._buffer.Buffer;

  if (!content && !encoding) throw new Error("No content");
  var name = Path.getFileName(path);
  var parent_path = Path.getParent(path);
  var cwd = this._process.cwd();

  var parent = null;
  try {
    parent = this._vfs.getDirectory(cwd, parent_path, true);
  } catch (_) {
    throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
  }
  var item = parent.getItem(name);
  if (!item) {
    throw new VirtualFileSystemError(_errno2.default.code.ENOENT, path);
  }
  if (item.type !== 'file') {
    // TODO: throwing isdir when !isfile?
    throw new VirtualFileSystemError(_errno2.default.code.EISDIR, path);
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

VirtualNodeFs_prototype.join = Path.combine;
VirtualNodeFs_prototype.normalize = Path.normalize;

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
  var stream = new this.WriteStream(),
      _this = this;
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
    _this.writeFile(path, Buffer.concat(bl, len), callback);
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

}).call(this,require("buffer").Buffer)
},{"./path":8,"./virtual-fs":9,"buffer":11,"errno":14}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.normalize = normalize;
exports.combine = combine;
exports.isRelative = isRelative;
exports.isAbsolute = isAbsolute;
exports.resolve = resolve;
exports.explode = explode;
exports.isLocal = isLocal;
exports.isGlobal = isGlobal;
exports.getParent = getParent;
exports.getFileName = getFileName;
exports.getFileNameWithoutExt = getFileNameWithoutExt;
exports.getExt = getExt;
function normalize(path) {
  path = path.replace(/[\\\/]+/g, '/');

  return repeatUntilSettled('' + path, iterate);

  function repeatUntilSettled(inp, fn) {
    for (;;) {
      var np = fn(inp);
      if (np === inp) return np;
      inp = np;
    }
  }

  function iterate(path) {
    return path.replace(/[\\\/]+/g, '/').replace(/[\/]\.(\/|$)/g, function (_, a) {
      return a || '';
    }).replace(/(^|\/)[^\/]*\/\.\.($|\/)/g, function (_, a, b) {
      return a + b;
    });
  }
}

function combine() {
  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
    args[_key] = arguments[_key];
  }

  return args.join('/');
}

function isRelative(path) {
  return !isAbsolute(path);
}
function isAbsolute(path) {
  return (/^[\\\/]/.test(path)
  );
}

function resolve(path) {
  for (var _len2 = arguments.length, parts = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    parts[_key2 - 1] = arguments[_key2];
  }

  return parts.reduce(function (path, part) {
    return normalize(isAbsolute(part) ? part : path + '/' + part);
  }, normalize(path));
}

function explode(path) {
  return {
    relative: isRelative(path),
    components: path.split(/[\\\/]+/g).filter(function (i) {
      return i;
    })
  };
}

function isLocal(path) {
  return (/^(?:\.|\.\.)(?:\\|\/|$)/.test(path)
  );
}

function isGlobal(path) {
  return !isLocal(path);
}

function getParent(path) {
  var m = /^(.*[\\\/])[^\\\/]+[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

function getFileName(path) {
  var m = /[\\\/]([^\\\/]+)[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

function getFileNameWithoutExt(path) {
  var fn = getFileName(path);
  var ext = getExt(fn);
  return fn.substring(0, fn.length - ext.length);
}

function getExt(path) {
  var m = /\.[^\.\\\/]*$/.exec(path);
  return m ? m[0] : '';
}

},{}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.VirtualFs = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _path = require('./path');

var Path = _interopRequireWildcard(_path);

var _memFs = require('./mem-fs');

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function any_to_text(x) {
  if (typeof x === "string") {
    return x;
  } else if (x instanceof Uint8Array) {
    var decoder = new TextDecoder();
    return decoder.decode(x);
  } else {
    throw new Error("cant convert content");
  }
}

function any_to_bytes(x) {
  if (typeof x === "string") {
    var decoder = new TextEncoder();
    return decoder.encode(x);
  } else if (x instanceof Uint8Array) {
    return x;
  } else {
    throw new Error("cant convert content");
  }
}

function any_to_any(x, type) {
  switch (type) {
    case 'text':
      return any_to_text(x);
    case 'bytes':
      return any_to_bytes(x);
    default:
      throw new Error("unknown type: " + type);
  }
}

var VirtualFs = exports.VirtualFs = function () {
  function VirtualFs() {
    _classCallCheck(this, VirtualFs);

    this.root = new _memFs.MemoryDirectory('');
  }

  _createClass(VirtualFs, [{
    key: 'resolve',
    value: function resolve(cwd, path) {
      return Path.resolve(cwd, path);
    }
  }, {
    key: '_resolveExplode',
    value: function _resolveExplode(cwd, file) {
      return Path.explode(this.resolve(cwd, file)).components;
    }
  }, {
    key: 'getContent',
    value: function getContent(cwd, file) {
      var item = this.getItem(cwd, file, false);
      return this.getContentOf(item);
    }
  }, {
    key: 'getContentOf',
    value: function getContentOf(item) {
      return item && item.type === 'file' ? item.content : null;
    }
  }, {
    key: 'getContentOfAs',
    value: function getContentOfAs(item, type) {
      var data = this.getContentOf(item);
      if (data === null) return null;
      return any_to_any(data, type);
    }
  }, {
    key: 'getContentText',
    value: function getContentText(cwd, file) {
      return this.getContentAs(cwd, file, 'text');
    }
  }, {
    key: 'getContentBytes',
    value: function getContentBytes(cwd, file) {
      return this.getContentAs(cwd, file, 'bytes');
    }
  }, {
    key: 'getContentAs',
    value: function getContentAs(cwd, file, type) {
      var data = this.getContent(cwd, file);
      if (data === null) return null;
      return any_to_any(data, type);
    }
  }, {
    key: 'getItem',
    value: function getItem(cwd, file, checked) {
      var type = arguments.length <= 3 || arguments[3] === undefined ? null : arguments[3];

      var resolved = Path.resolve(cwd, file);
      var components = Path.explode(resolved).components;
      var item = this.root;

      var comp_len_dec = components.length - 1;
      if (comp_len_dec >= 0) {
        for (var i = 0; i < comp_len_dec; i++) {
          var component = components[i];
          item = item && item.getItem(component);
          if (item && item.type !== "directory") {
            throw new Error("Path contains files: " + resolved);
          }
          check();
        }
        item = item && item.getItem(components[comp_len_dec]);
        check();
      }
      if (type && item && item.type !== type) {
        throw new Error("VirtualFs.getItem item type mismatch: " + resolved);
      }
      return item;

      function check() {
        if (checked && !item) throw new Error("Fs item  not found: " + file);
      }
    }
  }, {
    key: 'readFileSync',
    value: function readFileSync(cwd, file) {
      var item = this.getItem(cwd, file, true);
      if (item.type !== 'file') {
        throw new Error("readFileSync: not a file");
      }
      return this._vfs.getContentOfAs(item, 'bytes');
    }
  }, {
    key: 'mkdir',
    value: function mkdir(cwd, path) {
      var components = this._resolveExplode(cwd, path);
      var item = this.root;
      components.forEach(function (component) {
        var nextItem = item.getItem(component);
        if (nextItem) {
          if (nextItem.type !== 'directory') {
            throw new Error("mkdir filename taken: " + path);
          }
        } else {
          nextItem = new _memFs.MemoryDirectory(component);
          item.setItem(nextItem);
        }
        item = nextItem;
      });
      return item;
    }
  }, {
    key: 'getDirectory',
    value: function getDirectory(cwd, path) {
      var checked = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

      return this.getItem(cwd, path, checked, 'directory');
    }
  }, {
    key: 'getFile',
    value: function getFile(cwd, path) {
      var checked = arguments.length <= 2 || arguments[2] === undefined ? true : arguments[2];

      return this.getItem(cwd, path, checked, 'file');
    }
  }, {
    key: 'removeItem',
    value: function removeItem(cwd, path) {
      var testFn = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      var name = Path.getFileName(path);
      var parent = this.getDirectory(cwd, Path.getParent(path), true);
      var item = parent.getItem(name);
      if (!testFn || testFn(item)) {
        parent.removeItem(name);
      }
    }
  }, {
    key: 'itemExists',
    value: function itemExists(cwd, file) {
      return !!this.getItem(cwd, file, false);
    }
  }, {
    key: 'isItemType',
    value: function isItemType(cwd, path, type) {
      var item = this.getItem(cwd, path, false);
      return !!(item && item.type === type);
    }
  }, {
    key: 'isFile',
    value: function isFile(cwd, path) {
      return this.isItemType(cwd, path, 'file');
    }
  }, {
    key: 'createDirectory',
    value: function createDirectory(parent, name) {
      name = String(name);
      var item = parent.getItem(name);
      if (item) {
        if (item.type !== 'directory') {
          throw new Error("A file with that name already exists");
        }
      } else {
        parent.setItem(new _memFs.MemoryDirectory(name));
      }
    }
  }]);

  return VirtualFs;
}();

},{"./mem-fs":6,"./path":8}],10:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],11:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('isarray')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    this.length = 0
    this.parent = undefined
  }

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
} else {
  // pre-set for values that may exist in the future
  Buffer.prototype.length = undefined
  Buffer.prototype.parent = undefined
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":10,"ieee754":15,"isarray":12}],12:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],13:[function(require,module,exports){
var prr = require('prr')

function init (type, message, cause) {
  prr(this, {
      type    : type
    , name    : type
      // can be passed just a 'cause'
    , cause   : typeof message != 'string' ? message : cause
    , message : !!message && typeof message != 'string' ? message.message : message

  }, 'ewr')
}

// generic prototype, not intended to be actually used - helpful for `instanceof`
function CustomError (message, cause) {
  Error.call(this)
  if (Error.captureStackTrace)
    Error.captureStackTrace(this, arguments.callee)
  init.call(this, 'CustomError', message, cause)
}

CustomError.prototype = new Error()

function createError (errno, type, proto) {
  var err = function (message, cause) {
    init.call(this, type, message, cause)
    //TODO: the specificity here is stupid, errno should be available everywhere
    if (type == 'FilesystemError') {
      this.code    = this.cause.code
      this.path    = this.cause.path
      this.errno   = this.cause.errno
      this.message =
        (errno.errno[this.cause.errno]
          ? errno.errno[this.cause.errno].description
          : this.cause.message)
        + (this.cause.path ? ' [' + this.cause.path + ']' : '')
    }
    Error.call(this)
    if (Error.captureStackTrace)
      Error.captureStackTrace(this, arguments.callee)
  }
  err.prototype = !!proto ? new proto() : new CustomError()
  return err
}

module.exports = function (errno) {
  var ce = function (type, proto) {
    return createError(errno, type, proto)
  }
  return {
      CustomError     : CustomError
    , FilesystemError : ce('FilesystemError')
    , createError     : ce
  }
}

},{"prr":17}],14:[function(require,module,exports){
var all = module.exports.all = [
  {
    errno: -2,
    code: 'ENOENT',
    description: 'no such file or directory'
  },
  {
    errno: -1,
    code: 'UNKNOWN',
    description: 'unknown error'
  },
  {
    errno: 0,
    code: 'OK',
    description: 'success'
  },
  {
    errno: 1,
    code: 'EOF',
    description: 'end of file'
  },
  {
    errno: 2,
    code: 'EADDRINFO',
    description: 'getaddrinfo error'
  },
  {
    errno: 3,
    code: 'EACCES',
    description: 'permission denied'
  },
  {
    errno: 4,
    code: 'EAGAIN',
    description: 'resource temporarily unavailable'
  },
  {
    errno: 5,
    code: 'EADDRINUSE',
    description: 'address already in use'
  },
  {
    errno: 6,
    code: 'EADDRNOTAVAIL',
    description: 'address not available'
  },
  {
    errno: 7,
    code: 'EAFNOSUPPORT',
    description: 'address family not supported'
  },
  {
    errno: 8,
    code: 'EALREADY',
    description: 'connection already in progress'
  },
  {
    errno: 9,
    code: 'EBADF',
    description: 'bad file descriptor'
  },
  {
    errno: 10,
    code: 'EBUSY',
    description: 'resource busy or locked'
  },
  {
    errno: 11,
    code: 'ECONNABORTED',
    description: 'software caused connection abort'
  },
  {
    errno: 12,
    code: 'ECONNREFUSED',
    description: 'connection refused'
  },
  {
    errno: 13,
    code: 'ECONNRESET',
    description: 'connection reset by peer'
  },
  {
    errno: 14,
    code: 'EDESTADDRREQ',
    description: 'destination address required'
  },
  {
    errno: 15,
    code: 'EFAULT',
    description: 'bad address in system call argument'
  },
  {
    errno: 16,
    code: 'EHOSTUNREACH',
    description: 'host is unreachable'
  },
  {
    errno: 17,
    code: 'EINTR',
    description: 'interrupted system call'
  },
  {
    errno: 18,
    code: 'EINVAL',
    description: 'invalid argument'
  },
  {
    errno: 19,
    code: 'EISCONN',
    description: 'socket is already connected'
  },
  {
    errno: 20,
    code: 'EMFILE',
    description: 'too many open files'
  },
  {
    errno: 21,
    code: 'EMSGSIZE',
    description: 'message too long'
  },
  {
    errno: 22,
    code: 'ENETDOWN',
    description: 'network is down'
  },
  {
    errno: 23,
    code: 'ENETUNREACH',
    description: 'network is unreachable'
  },
  {
    errno: 24,
    code: 'ENFILE',
    description: 'file table overflow'
  },
  {
    errno: 25,
    code: 'ENOBUFS',
    description: 'no buffer space available'
  },
  {
    errno: 26,
    code: 'ENOMEM',
    description: 'not enough memory'
  },
  {
    errno: 27,
    code: 'ENOTDIR',
    description: 'not a directory'
  },
  {
    errno: 28,
    code: 'EISDIR',
    description: 'illegal operation on a directory'
  },
  {
    errno: 29,
    code: 'ENONET',
    description: 'machine is not on the network'
  },
  {
    errno: 31,
    code: 'ENOTCONN',
    description: 'socket is not connected'
  },
  {
    errno: 32,
    code: 'ENOTSOCK',
    description: 'socket operation on non-socket'
  },
  {
    errno: 33,
    code: 'ENOTSUP',
    description: 'operation not supported on socket'
  },
  {
    errno: 34,
    code: 'ENOENT',
    description: 'no such file or directory'
  },
  {
    errno: 35,
    code: 'ENOSYS',
    description: 'function not implemented'
  },
  {
    errno: 36,
    code: 'EPIPE',
    description: 'broken pipe'
  },
  {
    errno: 37,
    code: 'EPROTO',
    description: 'protocol error'
  },
  {
    errno: 38,
    code: 'EPROTONOSUPPORT',
    description: 'protocol not supported'
  },
  {
    errno: 39,
    code: 'EPROTOTYPE',
    description: 'protocol wrong type for socket'
  },
  {
    errno: 40,
    code: 'ETIMEDOUT',
    description: 'connection timed out'
  },
  {
    errno: 41,
    code: 'ECHARSET',
    description: 'invalid Unicode character'
  },
  {
    errno: 42,
    code: 'EAIFAMNOSUPPORT',
    description: 'address family for hostname not supported'
  },
  {
    errno: 44,
    code: 'EAISERVICE',
    description: 'servname not supported for ai_socktype'
  },
  {
    errno: 45,
    code: 'EAISOCKTYPE',
    description: 'ai_socktype not supported'
  },
  {
    errno: 46,
    code: 'ESHUTDOWN',
    description: 'cannot send after transport endpoint shutdown'
  },
  {
    errno: 47,
    code: 'EEXIST',
    description: 'file already exists'
  },
  {
    errno: 48,
    code: 'ESRCH',
    description: 'no such process'
  },
  {
    errno: 49,
    code: 'ENAMETOOLONG',
    description: 'name too long'
  },
  {
    errno: 50,
    code: 'EPERM',
    description: 'operation not permitted'
  },
  {
    errno: 51,
    code: 'ELOOP',
    description: 'too many symbolic links encountered'
  },
  {
    errno: 52,
    code: 'EXDEV',
    description: 'cross-device link not permitted'
  },
  {
    errno: 53,
    code: 'ENOTEMPTY',
    description: 'directory not empty'
  },
  {
    errno: 54,
    code: 'ENOSPC',
    description: 'no space left on device'
  },
  {
    errno: 55,
    code: 'EIO',
    description: 'i/o error'
  },
  {
    errno: 56,
    code: 'EROFS',
    description: 'read-only file system'
  },
  {
    errno: 57,
    code: 'ENODEV',
    description: 'no such device'
  },
  {
    errno: 58,
    code: 'ESPIPE',
    description: 'invalid seek'
  },
  {
    errno: 59,
    code: 'ECANCELED',
    description: 'operation canceled'
  }
]

module.exports.errno = {}
module.exports.code = {}

all.forEach(function (error) {
  module.exports.errno[error.errno] = error
  module.exports.code[error.code] = error
})

module.exports.custom = require('./custom')(module.exports)
module.exports.create = module.exports.custom.createError

},{"./custom":13}],15:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],16:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],17:[function(require,module,exports){
/*!
  * prr
  * (c) 2013 Rod Vagg <rod@vagg.org>
  * https://github.com/rvagg/prr
  * License: MIT
  */

(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports)
    module.exports = definition()
  else
    context[name] = definition()
})('prr', this, function() {

  var setProperty = typeof Object.defineProperty == 'function'
      ? function (obj, key, options) {
          Object.defineProperty(obj, key, options)
          return obj
        }
      : function (obj, key, options) { // < es5
          obj[key] = options.value
          return obj
        }

    , makeOptions = function (value, options) {
        var oo = typeof options == 'object'
          , os = !oo && typeof options == 'string'
          , op = function (p) {
              return oo
                ? !!options[p]
                : os
                  ? options.indexOf(p[0]) > -1
                  : false
            }

        return {
            enumerable   : op('enumerable')
          , configurable : op('configurable')
          , writable     : op('writable')
          , value        : value
        }
      }

    , prr = function (obj, key, value, options) {
        var k

        options = makeOptions(value, options)

        if (typeof key == 'object') {
          for (k in key) {
            if (Object.hasOwnProperty.call(key, k)) {
              options.value = key[k]
              setProperty(obj, k, options)
            }
          }
          return obj
        }

        return setProperty(obj, key, options)
      }

  return prr
})
},{}]},{},[1]);
