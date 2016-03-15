"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VERSION = 'v5.7.0';
function Object_entries(x) {
    return Object.keys(x).map(function (k) {
        return [k, x[k]];
    });
}
module.exports = function () {
    function Process(binding) {
        var _this = this;

        _classCallCheck(this, Process);

        this._cwd = binding.cwd;
        this.argv = [binding.executable];
        this.binding = binding;
        this.env = {};
        this.version = VERSION;

        this.stdin = null;
        this.stdout = null;
        this.stderr = null;

        Object_entries(Process.prototype).forEach(function (_ref) {
            var _ref2 = _slicedToArray(_ref, 2);

            var key = _ref2[0];
            var value = _ref2[1];

            // bind all functions to instance
            if (typeof value === "function") {
                _this[key] = value.bind(_this);
            }
        });
    }

    _createClass(Process, [{
        key: "nextTick",
        value: function nextTick(cb) {
            setTimeout(function () {
                cb();
            }, 0);
        }
    }, {
        key: "cwd",
        value: function cwd() {
            return this._cwd;
        }
    }, {
        key: "chdir",
        value: function chdir(rel) {
            this._cwd = this.binding.path.resolve(this._cwd, rel);
        }
    }]);

    return Process;
}();
