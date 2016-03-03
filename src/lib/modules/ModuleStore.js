import VirtualPath from '../vfs/VirtualPath';

export class Module {
    constructor(name) {
        this.name = name;
        this.directory = null;
        this.moduleFile = null;
        this.module = { exports: {} };
    }
}

export class ModuleLoader {
    constructor(vfs, store, process) {
        this.vfs = vfs;
        this.store = store;
        this.process = process;
    }

    evalInScope(scope, script) {
        with(scope) {
            eval(script);
        }
    }

    runScript(cwd, script) {
        return this._runScript(cwd, script, null);
    }
    _runScript(cwd, script, module) {
        const _this = this;
        const scope = {
            globals: null,
            process: this.process,
            require,
            module
        };
        scope.globals = scope;
        this.evalInScope(scope, script);
        function require(moduleName) {
            return _this.store.require(cwd, moduleName);
        }
    }

    load(store, module) {
        const script = this.vfs.readText(module.moduleFile);
        return this._runScript(module.directory, script, module.module);
    }
}

export class ModuleStore {
    constructor(resolver, loader) {
        this.resolver = resolver;
        this.loader = loader;
        this.store = new Map();
    }

    requireModule(cwd, path) {
        var name = this.resolver.normalize(cwd, path);
        const tmp = this.store.get(name);

        if (tmp) return tmp;

        const moduleFile = this.resolver.findModuleFile(cwd, path);
        if (!moduleFile) throw new Error("Module not found: " + moduleFile);
        var module = new Module(name);
        this.store.set(name, module);
        module.moduleFile = moduleFile;
        module.directory = VirtualPath.getParent(moduleFile);
        this.loader.load(this, module);
        return module;
    }

    require(cwd, path) {
        return this.requireModule(cwd, path).module.exports;
    }
}