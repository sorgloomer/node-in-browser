
import * as Path from "../vfs/path";

function _is_module_local(module_name) {
    return /^(?:|[a-zA-Z0-9]+:|\.|\.\.)(?:\\|\/|$)/.test(module_name);
}

export function Module(name, directory, exports = {}) {
    this.name = name;
    this.filename = "TODO"; // TODO
    this.directory = directory;
    this.exports = exports;
    this._require_path = "";
}

export class NodeContainer {
    constructor(fs, cwd, modules, redirects = null) {
        this.fs = fs;
        this.redirects = redirects;
        this.modules = new Map(modules.map(x => [x.name, x]));
        this.main_module = new Module('main', cwd);
    }
    require_by_parent(module_name, parent_module) {
        const module = this.require_module(parent_module, module_name);
        if (!module) throw new Error('Cannot find module: ' + module_name + " <- " + parent_module._require_path);
        return module.exports;
    }

    require(module_name) {
        return this.require_by_parent(module_name, this.main_module);
    }

    _attempt_load_file(parent_module, module_name, real_file_name, module_id) {
        var temp = this.modules.get(module_id);
        if (temp) return temp;
        if (!this.fs.existsSync(real_file_name)) {
            return null;
        }
        const stat = this.fs.statSync(real_file_name);
        if (!stat.isFile()) {
            return null;
        }
        const source = this.fs.readFileSync(real_file_name, "utf-8");
        const module = new Module(module_id, Path.getParent(real_file_name));
        module._require_path = module_name + " <- " + parent_module._require_path;
        this.modules.set(module_id, module);

        try {
            if (Path.getExt(real_file_name) === '.json') {
                module.exports = JSON.parse(source);
            } else {
                this._eval_module(module, source);
            }
        } catch(e) {
            this.modules.delete(module_id);
            throw e;
        }
        return module;
    }
    _require_module_local(parent_module, module_name) {
        const file_name = Path.resolve(parent_module.directory, module_name);
        var result = this._attempt_load_file(parent_module, module_name, file_name, file_name);
        if (!result && !Path.getExt(file_name)) {
            result = this._attempt_load_file(parent_module, module_name, file_name + '.js', file_name + '.js');
        }
        return result;
    }
    _require_module_node_single(parent_module, module_name, absolute_module_id) {
        absolute_module_id = Path.normalize(absolute_module_id);
        var result = this._attempt_load_file(parent_module, module_name, absolute_module_id, absolute_module_id);
        if (result) return result;
        result = this._attempt_load_file(parent_module, module_name, absolute_module_id + '.js', absolute_module_id);
        if (result) return result;
        result = this._attempt_load_file(parent_module, module_name, Path.resolve(absolute_module_id, 'index.js'), absolute_module_id);
        if (result) return result;
        const json_file_name = Path.resolve(absolute_module_id, 'package.json');
        if (!this.fs.existsSync(json_file_name)) {
            return null;
        }
        const stat = this.fs.statSync(json_file_name);
        if (!stat.isFile()) {
            return null;
        }
        const source = this.fs.readFileSync(json_file_name, "utf-8");
        const package_data = JSON.parse(source);
        const real_file_name = typeof package_data.browser === "string" ? package_data.browser : package_data.main;
        result = this._attempt_load_file(parent_module, module_name, Path.resolve(absolute_module_id, real_file_name), absolute_module_id);
        if (result) return result;
        return result;
    }
    _require_module_node(parent_module, module_name) {
        if (this.redirects && Object.prototype.hasOwnProperty.call(this.redirects, module_name)) {
            const redirect = this.redirects[module_name];
            return this._require_module_node_single(parent_module, module_name, redirect);
        } else {
            var temp = this.modules.get(module_name);
            if (temp) return temp;
            var search = parent_module.directory;
            for (;;) {
                const file_candidate = Path.resolve(search, 'node_modules', module_name);
                temp = this._require_module_node_single(parent_module, module_name, file_candidate);
                if (temp) return temp;
                const temp_search = Path.getParent(search);
                if (temp_search === search) return null;
                search = temp_search;
            }
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
            'require', 'module', 'exports', '__filename', '__dirname', code
        ))(
            this._make_require(module_obj), module_obj, module_obj.exports,
            module_obj.filename, module_obj.directory
        );
    }
    _make_require(module_obj) {
        var _this = this;
        return function require(module_name) {
            return _this.require_by_parent(module_name, module_obj);
        }
    }
    eval_lines(code) {
        return this._eval_module(this.main_module, code);
    }
    eval(code) {
        return this.eval_lines("return " + code);
    }
}
