import VirtualPath from '../vfs/VirtualPath';

export class Module {
    constructor(name, exports = {}) {
        this.name = name;
        this.directory = null;
        this.moduleFile = null;
        this.module = { exports };
    }
}

export function createScopedFunction(names, script) {
    return new Function(...names, script);
}

export class ModuleLoader {
    constructor(vfs, store, process) {
        this.vfs = vfs;
        this.store = store;
        this.process = process;
    }

    evalInScope(scope, script) {
        const names = Object.keys(scope);
        createScopedFunction(names, script)(...names.map(n => scope[n]));
    }

    runScript(cwd, script) {
        return this._runScript(cwd, script, null);
    }
    _runScript(cwd, script, module) {
        const _this = this;
        const scope = {
            global: null,
            process: this.process,
            require: requireExports,
            module
        };
        scope.global = scope;
        this.evalInScope(scope, script);
        function requireExports(moduleName) {
            return _this.store.requireExports(cwd, moduleName);
        }
    }

    load(module) {
        const script = this.vfs.loadText(this.process.cwd(), module.moduleFile);
        return this._runScript(module.directory, script, module.module);
    }
}

export class ModuleStore {
    constructor(resolver, loader) {
        this.resolver = resolver;
        this.loader = loader;
        this.store = new Map();
    }

    registerModule(module) {
        this.store.set(module.name, module);
    }

    requireModule(cwd, path) {
        var name = this.resolver.normalize(cwd, path);
        const tmp = this.store.get(name);

        if (tmp) return tmp;

        const moduleFile = this.resolver.findModuleFile(cwd, path);
        if (!moduleFile) throw new Error("Module not found: " + moduleFile);
        var module = new Module(name);
        this.registerModule(module);
        module.moduleFile = moduleFile;
        module.directory = VirtualPath.getParent(moduleFile);
        this.loader.load(module);
        return module;
    }

    requireExports(cwd, path) {
        return this.requireModule(cwd, path).module.exports;
    }
}