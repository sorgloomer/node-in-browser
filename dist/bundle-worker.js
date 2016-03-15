(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _path = require("../vfs/path");

var Path = _interopRequireWildcard(_path);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Binding = function Binding(vfs, exe, cwd) {
    _classCallCheck(this, Binding);

    this.path = Path;
    this.vfs = vfs;
    this.cwd = cwd;
    this.executable = exe;
};

exports.default = Binding;

},{"../vfs/path":8}],2:[function(require,module,exports){
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

},{"./node-env":4}],3:[function(require,module,exports){
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
                throw new Error("Couldn't instantiate module: " + module._require_path + ", error: " + e.message, e);
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

},{"../vfs/path":8}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _virtualFs = require("../vfs/virtual-fs");

var _httpFs = require("../vfs/http-fs");

var _binding = require("./binding");

var _binding2 = _interopRequireDefault(_binding);

var _path = require("../vfs/path");

var Path = _interopRequireWildcard(_path);

var _nodeContainer = require("./node-container");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var INITIAL_FOLDER_NAME = "home";
var INITIAL_FOLDER = "/" + INITIAL_FOLDER_NAME;
var EXECUTABLE = "/bin/node";

var INIT_PROGRAM = "\n  var scope = self;\n  scope.global = scope;\n  scope.Buffer = require('buffer').Buffer;\n  var Process = require('browser-process');\n  var binding = require('binding');\n  var process = new Process(binding);\n  scope.process = process;\n  // browser-process-init depends on streams transitively\n  // but streams depend on process.nextTick\n  // so initialization of process had to be splitted\n  // to fulfill the dependency graph\n  require('browser-process-init')(process);\n";

function initialize() {
    var vfs = new _virtualFs.VirtualFs();
    var httpDir = new _httpFs.HttpDirectory("/node_modules", "node_modules");
    vfs.root.setItem(httpDir);
    var moduleDir = new _httpFs.HttpDirectory("/modules", "modules");
    vfs.root.setItem(moduleDir);
    vfs.createDirectory(vfs.root, INITIAL_FOLDER_NAME);

    var binding = new _binding2.default(vfs, EXECUTABLE, INITIAL_FOLDER);
    var module_list = [new _nodeContainer.Module('binding', null, binding)];

    var M = "/modules/";
    var R = "/node_modules/";
    var redirects = {
        "fs": M + "fs",
        "child_process": M + "child_process",
        "node-vfs": M + "node-vfs",
        "browser-process": M + "process",
        "browser-process-init": M + "process-init",

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

    var container = new _nodeContainer.NodeContainer(vfs, INITIAL_FOLDER, module_list, redirects);

    // setup node globals and process
    container.eval_lines(INIT_PROGRAM);

    return container;
}

exports.default = initialize;

},{"../vfs/http-fs":6,"../vfs/path":8,"../vfs/virtual-fs":9,"./binding":1,"./node-container":3}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
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

},{"./fetch-sync":5}],7:[function(require,module,exports){
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

},{}],8:[function(require,module,exports){
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

},{"./mem-fs":7,"./path":8}]},{},[2]);
