
import * as Path from "../vfs/path";

function _is_module_local(module_name) {
    return /^(?:|[a-zA-Z0-9]+:|\.|\.\.)(?:\\|\/|$)/.test(module_name);
}

export function Module(file, exports = {}) {
    this.name = file;
    this.file = file;
    this.exports = exports;
}

export class NodeContainer {
    constructor(fs, modules) {
        this.fs = fs;
        this.modules = new Map(modules.map(x => [x.name, x]));
        this.main_module = new Module('/user');
    }
    require(parent_module, module_name) {
        const module = this.require_module(parent_module, module_name);
        if (!module) throw new Error('Cannot find module: ' + module_name);
        return module.exports;
    }

    _attempt_load_file(file_name) {
        var temp = this.modules.get(file_name);
        if (temp) return temp;
        try {
            const source = this.fs.readFileSync(file_name, { encoding: "utf-8" });
            const module = new Module(file_name);
            this._eval_module(module, source);
            return module;
        } catch (e) {
            return null;
        }
    }
    _require_module_local(parent_module, module_name) {
        const file_name = Path.resolve(parent_module.name, '..', module_name);
        var result = this._attempt_load_file(module_name, file_name);
        if (!result && !Path.getExt(file_name)) {
            result = this._attempt_load_file(module_name, file_name + '.js');
        }
        return result;
    }
    _require_module_node_single(file_name) {
        var result = this._attempt_load_file(file_name);
        if (result) return result;
        if (!Path.getExt(file_name)) {
            result = this._attempt_load_file(file_name + '.js');
            if (result) return result;
            result = this._attempt_load_file(Path.combine(file_name, 'index.js'));
            if (result) return result;
            try {
                const source = this.fs.readFileSync(Path.combine(file_name, 'package.json'), { encoding: "utf-8" });
                const package_data = JSON.parse(source);
                result = this._attempt_load_file(Path.combine(file_name, package_data.index)); // TODO: package.index?
                if (result) return result;
                return module;
            } catch (e) {
            }
        }
        return result;
    }
    _require_module_node(parent_module, module_name) {
        var temp = this.modules.get(module_name);
        if (temp) return temp;
        var search = parent_module.name;
        for (;;) {
            const temp_search = Path.getParent(search);
            if (temp_search === search) return null;
            search = temp_search;
            const file_candidate = Path.combine(search, 'node_modules', module_name);
            temp = this._require_module_node_single(file_candidate);
            if (temp) return temp;
        }
    }
    require_module(parent_module, module_name) {
        if (_is_module_local(module_name)) {
            return this._require_module_local(parent_module, module_name);
        } else {
            return this._require_module_node(parent_module, module_name);
        }
    }
    _eval_module(module_obj, code) {
        return (new Function(
            'require', 'module', 'exports', code
        ))(
            this._make_require(module_obj), module_obj, module_obj.exports
        );
    }
    _make_require(module_obj) {
        var _this = this;
        return function require(module_name) {
            return _this.require(module_obj.name, module_name);
        }
    }
    eval_lines(code) {
        return this._eval_module(this.main_module, code);
    }
    eval(code) {
        this.eval_lines("return " + code);
    }
}
