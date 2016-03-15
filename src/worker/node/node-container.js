
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

function ModuleError(module, path, inner) {
    const message = `Couldn't initialize module: ${module} (${path}) because of: ${inner.message}`;
    Error.call(this, message);
    this.inner = inner;
    this.module = module;
    this.path = path;
}
ModuleError.prototype = Object.create(Error.prototype);
ModuleError.prototype.constructor = ModuleError;
ModuleError.prototype.name = 'ModuleError';


function entry_from_package_data(pd) {
    if (pd !== null) {
        if (typeof pd.browser === "string") return pd.browser;
        if (typeof pd.main === "string") return pd.main;
    }
    return "index.js";
}

export class NodeContainer {
    constructor(vfs, cwd, modules, redirects = null) {
        this.vfs = vfs;
        this.redirects = redirects;
        this.modules = new Map(modules.map(x => [x.name, x]));
        this.main_module = new Module('main', cwd);
    }
    require_by_parent(module_name, parent_module) {
        const module = this.require_module(parent_module, module_name);
        if (!module) throw new Error('Cannot find module: ' + module_name + " <- " + parent_module._require_path);
        return module.exports;
    }
    _getSource(file) {
        return this.vfs.getContentText("/", file);
    }

    require(module_name) {
        return this.require_by_parent(module_name, this.main_module);
    }

    _attempt_load_file(parent_module, module_name, real_file_name, module_id) {
        var temp;
        temp = this.modules.get(real_file_name);
        if (temp) return temp;
        temp = this.modules.get(module_id);
        if (temp) return temp;

        const source = this._getSource(real_file_name);
        if (source === null) return null;
        const module = new Module(module_id, Path.getParent(real_file_name));
        module._require_path = `${module_id} (${module_name}) <- ${parent_module._require_path}`;

        this.modules.set(real_file_name, module);
        this.modules.set(module_id, module);

        try {
            if (Path.getExt(real_file_name) === '.json') {
                module.exports = JSON.parse(source);
            } else {
                this._eval_module(module, source);
            }
        } catch(e) {
            this.modules.delete(real_file_name);
            this.modules.delete(module_id);
            if (e instanceof ModuleError) {
                throw e;
            } else {
                const re = new ModuleError(module.name, module._require_path, e);
                // Chrome does not log anything except the error name for some reason,
                // that's why the explicit logging
                console.error(re);
                throw re;
            }
        }
        return module;
    }
    _require_module_local(parent_module, module_name) {
        const file_name = Path.resolve(parent_module.directory, module_name);
        return this._require_module_node_single(parent_module, module_name, file_name);
    }

    _attempt_load_file_ext(parent_module, module_name, real_file_name, module_id) {
        var result = this._attempt_load_file(parent_module, module_name, real_file_name, module_id);
        if (result) return result;
        result = this._attempt_load_file(parent_module, module_name, real_file_name + '.js', module_id);
        if (result) return result;
        return this._attempt_load_file(parent_module, module_name, real_file_name + '.json', module_id);
    }

    _require_module_node_single(parent_module, module_name, absolute_module_id) {
        absolute_module_id = Path.normalize(absolute_module_id);
        var result = this._attempt_load_file_ext(parent_module, module_name, absolute_module_id, absolute_module_id);
        if (result) return result;

        const json_file_name = Path.resolve(absolute_module_id, 'package.json');

        const source = this._getSource(json_file_name);
        const package_data = source === null ? null : JSON.parse(source);
        const real_file_name = entry_from_package_data(package_data);
        return this._attempt_load_file_ext(parent_module, module_name, Path.resolve(absolute_module_id, real_file_name), absolute_module_id);
    }
    _require_module_node(parent_module, module_name) {
        if (this.redirects && Object.prototype.hasOwnProperty.call(this.redirects, module_name)) {
            const redirect = this.redirects[module_name];
            return this._require_module_node_single(parent_module, module_name, redirect);
        } else {
            var temp = this.modules.get(module_name);
            if (temp) return temp;
            var search = parent_module.directory;
            // if (module_name === "retry") debugger;
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
        const decorated_code = (
`
// module: ${JSON.stringify(module_obj.name)}
// file: ${JSON.stringify(module_obj.filename)}
// dir: ${JSON.stringify(module_obj.directory)}

${code}`
        );
        return (new Function(
            'require', 'module', 'exports', '__filename', '__dirname', decorated_code
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
