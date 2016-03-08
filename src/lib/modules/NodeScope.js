
import { VirtualFs } from '../vfs/VirtualFs';
import { HttpDirectory } from '../vfs/HttpFs';
import { VirtualNodeFs } from '../vfs/VirtualNodeFs';
import { ModuleStore, ModuleLoader, Module } from './ModuleStore';
import { ModuleResolver } from './ModuleResolver';
import { ProcessObject } from '../process/ProcessObject';

export class NodeScope {
    constructor({cwd = "/user", common = "/common", tmp = "/tmp"} = {}, common_root = "/common") {
        this.roots = { cwd, common, tmp };
        this.vfs = new VirtualFs();
        this.vfs.root.setItem(new HttpDirectory(common_root, common.replace(/^\//g, '')));
        this.vfs.mkdir('/', this.roots.cwd);
        this.moduleResolver = new ModuleResolver(this.vfs);
        this.process = new ProcessObject(null, this.roots.cwd);
        this.moduleLoader = new ModuleLoader(this.vfs, null, this.process);
        this.moduleStore = new ModuleStore(this.moduleResolver, this.moduleLoader);
        this.moduleLoader.store = this.moduleStore;
        this.moduleStore.registerModule(new Module('fs', new VirtualNodeFs(this.vfs, this.process)));
    }

    eval(script) {
        this.moduleLoader.runScript(this.roots.cwd, script);
    }
}