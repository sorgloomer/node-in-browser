/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _NodeScope = __webpack_require__(1);

	new _NodeScope.NodeScope().eval('\n\nvar fs = require(\'fs\');\nfs.storeText(\'./mymodule.js\', "console.log(\'p mymodule\');");\n\nconsole.log(\'p main #1\');\nrequire(\'./mymodule\');\nconsole.log(\'p main #2\');\n\n');


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.NodeScope = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _VirtualFs = __webpack_require__(2);

	var _VirtualNodeFs = __webpack_require__(4);

	var _ModuleStore = __webpack_require__(5);

	var _ModuleResolver = __webpack_require__(6);

	var _ProcessObject = __webpack_require__(7);

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var NodeScope = exports.NodeScope = function () {
	    function NodeScope() {
	        var entryCwd = arguments.length <= 0 || arguments[0] === undefined ? '/user' : arguments[0];

	        _classCallCheck(this, NodeScope);

	        this.entryCwd = entryCwd;
	        this.vfs = new _VirtualFs.VirtualFs();
	        this.vfs.mkdir(this.entryCwd);
	        this.moduleResolver = new _ModuleResolver.ModuleResolver(this.vfs);
	        this.process = new _ProcessObject.ProcessObject(null, this.entryCwd);
	        this.moduleLoader = new _ModuleStore.ModuleLoader(this.vfs, null, this.process);
	        this.moduleStore = new _ModuleStore.ModuleStore(this.moduleResolver, this.moduleLoader);
	        this.moduleLoader.store = this.moduleStore;
	        this.moduleStore.registerModule(new _ModuleStore.Module('fs', new _VirtualNodeFs.VirtualNodeFs(this.vfs, this.process)));
	    }

	    _createClass(NodeScope, [{
	        key: 'eval',
	        value: function _eval(script) {
	            this.moduleLoader.runScript(this.entryCwd, script);
	        }
	    }]);

	    return NodeScope;
	}();


/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.VirtualFs = exports.MemoryFile = exports.MemoryDirectory = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _VirtualPath = __webpack_require__(3);

	var _VirtualPath2 = _interopRequireDefault(_VirtualPath);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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
	    value: function getItem(name) {
	      return this.items.get(name);
	    }
	  }, {
	    key: "getItems",
	    value: function getItems() {
	      return Array.from(this.items.values);
	    }
	  }, {
	    key: "setItem",
	    value: function setItem(item) {
	      this.items.set(item.name, item);
	    }
	  }]);

	  return MemoryDirectory;
	}();

	var MemoryFile = exports.MemoryFile = function MemoryFile(name, contents) {
	  _classCallCheck(this, MemoryFile);

	  if (!(contents instanceof Uint8Array)) throw new Error("MemoryFile contents must be Uint8Array");

	  this.name = name;
	  this.type = "file";
	  this.contents = contents;
	};

	var VirtualFs = exports.VirtualFs = function () {
	  function VirtualFs() {
	    _classCallCheck(this, VirtualFs);

	    this.root = new MemoryDirectory('');
	  }

	  _createClass(VirtualFs, [{
	    key: "resolve",
	    value: function resolve(cwd, path) {
	      return _VirtualPath2.default.resolve(cwd, path);
	    }
	  }, {
	    key: "_resolveExplode",
	    value: function _resolveExplode(cwd, file) {
	      return _VirtualPath2.default.explode(this.resolve(cwd, file)).components;
	    }
	  }, {
	    key: "getItem",
	    value: function getItem(cwd, file, checked) {
	      var components = this._resolveExplode(cwd, file);
	      var item = this.root;
	      components.forEach(function (component) {
	        item = item && item.getItem(component);
	      });
	      if (checked && !item) throw new Error("Fs item  not found: " + file);
	      return item;
	    }
	  }, {
	    key: "readFileSync",
	    value: function readFileSync(cwd, file) {
	      var item = this.getItem(cwd, file, true);
	      if (item.type !== 'file') {
	        throw new Error("readFileSync: not a file");
	      }
	      return item.contents;
	    }
	  }, {
	    key: "mkdir",
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
	          nextItem = new MemoryDirectory(component);
	          item.setItem(nextItem);
	        }
	        item = nextItem;
	      });
	      return item;
	    }
	  }, {
	    key: "getItemType",
	    value: function getItemType(cwd, path, type, checked) {
	      var result = this.getItem(cwd, path, checked);
	      if (result && result.type !== type) throw new Error("Item is not " + type);
	      return result;
	    }
	  }, {
	    key: "getDirectory",
	    value: function getDirectory(cwd, path, checked) {
	      return this.getItemType(cwd, path, 'directory', checked);
	    }
	  }, {
	    key: "getFile",
	    value: function getFile(cwd, path, checked) {
	      return this.getItemType(cwd, path, 'file', checked);
	    }
	  }, {
	    key: "storeBytes",
	    value: function storeBytes(cwd, path, content) {
	      this.mkdir(cwd, _VirtualPath2.default.getParent(path)).setItem(new MemoryFile(_VirtualPath2.default.getFileName(path), content));
	    }
	  }, {
	    key: "storeText",
	    value: function storeText(cwd, path, content) {
	      var encoder = new TextEncoder('utf-8');
	      this.storeBytes(cwd, path, encoder.encode(content));
	    }
	  }, {
	    key: "loadBytes",
	    value: function loadBytes(cwd, path) {
	      return this.getFile(cwd, path, true).contents;
	    }
	  }, {
	    key: "loadText",
	    value: function loadText(cwd, path) {
	      var decoder = new TextDecoder('utf-8');
	      return decoder.decode(this.loadBytes(cwd, path));
	    }
	  }, {
	    key: "itemExists",
	    value: function itemExists(cwd, file) {
	      return !!this.getItem(cwd, file, false);
	    }
	  }, {
	    key: "isItemType",
	    value: function isItemType(cwd, path, type) {
	      var item = this.getItem(cwd, path, false);
	      return !!(item && item.type === type);
	    }
	  }, {
	    key: "isFile",
	    value: function isFile(cwd, path) {
	      return this.isItemType(cwd, path, 'file');
	    }
	  }]);

	  return VirtualFs;
	}();


/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});


	function normalize(path) {
	  return repeatUntilSettled('' + path, iterate);

	  function repeatUntilSettled(inp, fn) {
	    for (;;) {
	      var np = fn(inp);
	      if (np === inp) return np;
	      inp = np;
	    }
	  }

	  function iterate(path) {
	    path = path.replace(/[\\\/]+/g, '/');
	    path = path.replace(/[\/]\.$/, '');
	    path = path.replace(/[\/]\.\//g, '/');
	    path = path.replace(/(^|\/)[^\/]*\/\.\.($|\/)/g, function (a, b, c) {
	      return b + c;
	    });
	    return path;
	  }
	}

	function combine() {
	  for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
	    args[_key] = arguments[_key];
	  }

	  return args.join('/');
	}

	function isRelative(path) {
	  return (/^[^\\\/]/.test(path)
	  );
	}

	function resolve(cwd, path) {
	  return normalize(isRelative(path) ? combine(cwd, path) : path);
	}

	function explode(path) {
	  return {
	    relative: isRelative(path),
	    components: path.split(/[\\\/]+/g)
	  };
	}

	function isRelativeOrAbsolute(path) {
	  return (/^(?:\.|\.\.)(?:\\|\/|$)/.test(path)
	  );
	}

	function getParent(path) {
	  var m = /^(.*)[\\\/][^\\\/]+[\\\/]*$/.exec(path);
	  return m ? m[1] : path;
	}

	function getFileName(path) {
	  var m = /[\\\/]([^\\\/]+)[\\\/]*$/.exec(path);
	  return m ? m[1] : path;
	}

	exports.default = {
	  combine: combine, normalize: normalize, explode: explode, isRelative: isRelative, resolve: resolve, isRelativeOrAbsolute: isRelativeOrAbsolute, getParent: getParent, getFileName: getFileName
	};


/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.VirtualNodeFs = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _VirtualPath = __webpack_require__(3);

	var _VirtualPath2 = _interopRequireDefault(_VirtualPath);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var VirtualNodeFs = exports.VirtualNodeFs = function () {
	  function VirtualNodeFs(vfs, process) {
	    _classCallCheck(this, VirtualNodeFs);

	    this._vfs = vfs;
	    this._process = process;
	  }

	  _createClass(VirtualNodeFs, [{
	    key: 'storeText',
	    value: function storeText(path, text) {
	      this._vfs.storeText(this._process.cwd(), path, text);
	    }
	  }]);

	  return VirtualNodeFs;
	}();


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});
	exports.ModuleStore = exports.ModuleLoader = exports.Module = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _VirtualPath = __webpack_require__(3);

	var _VirtualPath2 = _interopRequireDefault(_VirtualPath);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var Module = exports.Module = function Module(name) {
	    var exports = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

	    _classCallCheck(this, Module);

	    this.name = name;
	    this.directory = null;
	    this.moduleFile = null;
	    this.module = { exports: exports };
	};

	var ModuleLoader = exports.ModuleLoader = function () {
	    function ModuleLoader(vfs, store, process) {
	        _classCallCheck(this, ModuleLoader);

	        this.vfs = vfs;
	        this.store = store;
	        this.process = process;
	    }

	    _createClass(ModuleLoader, [{
	        key: "evalInScope",
	        value: function evalInScope(scope, script) {
	            var names = Object.keys(scope);
	            new (Function.prototype.bind.apply(Function, [null].concat(_toConsumableArray(names), [script])))().apply(undefined, _toConsumableArray(names.map(function (n) {
	                return scope[n];
	            })));
	        }
	    }, {
	        key: "runScript",
	        value: function runScript(cwd, script) {
	            return this._runScript(cwd, script, null);
	        }
	    }, {
	        key: "_runScript",
	        value: function _runScript(cwd, script, module) {
	            var _this = this;
	            var scope = {
	                global: null,
	                process: this.process,
	                require: requireExports,
	                module: module
	            };
	            scope.global = scope;
	            this.evalInScope(scope, script);
	            function requireExports(moduleName) {
	                return _this.store.requireExports(cwd, moduleName);
	            }
	        }
	    }, {
	        key: "load",
	        value: function load(module) {
	            var script = this.vfs.loadText(this.process.cwd(), module.moduleFile);
	            return this._runScript(module.directory, script, module.module);
	        }
	    }]);

	    return ModuleLoader;
	}();

	var ModuleStore = exports.ModuleStore = function () {
	    function ModuleStore(resolver, loader) {
	        _classCallCheck(this, ModuleStore);

	        this.resolver = resolver;
	        this.loader = loader;
	        this.store = new Map();
	    }

	    _createClass(ModuleStore, [{
	        key: "registerModule",
	        value: function registerModule(module) {
	            this.store.set(module.name, module);
	        }
	    }, {
	        key: "requireModule",
	        value: function requireModule(cwd, path) {
	            var name = this.resolver.normalize(cwd, path);
	            var tmp = this.store.get(name);

	            if (tmp) return tmp;

	            var moduleFile = this.resolver.findModuleFile(cwd, path);
	            if (!moduleFile) throw new Error("Module not found: " + moduleFile);
	            var module = new Module(name);
	            this.registerModule(module);
	            module.moduleFile = moduleFile;
	            module.directory = _VirtualPath2.default.getParent(moduleFile);
	            this.loader.load(module);
	            return module;
	        }
	    }, {
	        key: "requireExports",
	        value: function requireExports(cwd, path) {
	            return this.requireModule(cwd, path).module.exports;
	        }
	    }]);

	    return ModuleStore;
	}();


/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	Object.defineProperty(exports, "__esModule", {
	  value: true
	});
	exports.ModuleResolver = undefined;

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	var _VirtualPath = __webpack_require__(3);

	var _VirtualPath2 = _interopRequireDefault(_VirtualPath);

	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function firstNotNull(arr, fn) {
	  var found = false,
	      result = null;
	  Array.prototype.forEach.call(arr, function (x) {
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

	var ModuleResolver = exports.ModuleResolver = function () {
	  function ModuleResolver(fs) {
	    _classCallCheck(this, ModuleResolver);

	    this.fs = fs;
	    this.roots = ['./node_modules', '/node/modules'];
	    this.extension = '.js';
	  }

	  _createClass(ModuleResolver, [{
	    key: 'resolveFileModule',
	    value: function resolveFileModule(cwd, moduleName) {
	      var hasExt = ('' + moduleName).endsWith(this.extension);
	      var fileName = _VirtualPath2.default.resolve(cwd, hasExt ? moduleName : moduleName + this.extension);
	      return this.fs.isFile(cwd, fileName) ? fileName : null;
	    }
	  }, {
	    key: 'resolveNodeModule',
	    value: function resolveNodeModule(cwd, moduleName) {
	      return firstNotNull(this.roots, function (root) {
	        var absolute = _VirtualPath2.default.normalize(_VirtualPath2.default.combine(root, moduleName));
	        return this.fs.isFile(cwd, absolute) ? absolute : null;
	      });
	    }
	  }, {
	    key: 'normalize',
	    value: function normalize(cwd, moduleName) {
	      var localModule = _VirtualPath2.default.isRelativeOrAbsolute(moduleName);
	      if (localModule) {
	        return _VirtualPath2.default.resolve(cwd, moduleName);
	      } else {
	        return _VirtualPath2.default.normalize(moduleName);
	      }
	    }
	  }, {
	    key: 'findModuleFile',
	    value: function findModuleFile(cwd, moduleName) {
	      var localModule = _VirtualPath2.default.isRelativeOrAbsolute(moduleName);
	      if (localModule) {
	        return this.resolveFileModule(cwd, moduleName);
	      } else {
	        return this.resolveNodeModule(cwd, moduleName);
	      }
	    }
	  }]);

	  return ModuleResolver;
	}();


/***/ },
/* 7 */
/***/ function(module, exports) {

	"use strict";

	Object.defineProperty(exports, "__esModule", {
	    value: true
	});

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var ProcessObject = exports.ProcessObject = function () {
	    function ProcessObject(bindings) {
	        var cwd = arguments.length <= 1 || arguments[1] === undefined ? "/user/" : arguments[1];
	        var platform = arguments.length <= 2 || arguments[2] === undefined ? "browser" : arguments[2];

	        _classCallCheck(this, ProcessObject);

	        this.platform = platform;
	        this._bindings = bindings;
	        this._state = { cwd: cwd };
	    }

	    _createClass(ProcessObject, [{
	        key: "cwd",
	        value: function cwd() {
	            return this._state.cwd;
	        }
	    }, {
	        key: "chdir",
	        value: function chdir(path) {
	            this._state.cwd = path;
	        }
	    }]);

	    return ProcessObject;
	}();


/***/ }
/******/ ]);