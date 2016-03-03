
import { VirtualFs, MemoryDirectory, MemoryFile } from '../vfs/VirtualFs';
import { VirtualNodeFs } from '../vfs/VirtualNodeFs';
import { ModuleStore, ModuleLoader, Module } from './ModuleStore';
import { ModuleResolver } from './ModuleResolver';
import { ProcessObject } from '../process/ProcessObject';

export class NodeScope {
    constructor(entryCwd = '/user') {
        this.entryCwd = entryCwd;
        this.vfs = new VirtualFs();
        this.vfs.mkdir(this.entryCwd);
        this.moduleResolver = new ModuleResolver(this.vfs);
        this.process = new ProcessObject(null, this.entryCwd);
        this.moduleLoader = new ModuleLoader(this.vfs, null, this.process);
        this.moduleStore = new ModuleStore(this.moduleResolver, this.moduleLoader);
        this.moduleLoader.store = this.moduleStore;
        this.moduleStore.registerModule(new Module('fs', new VirtualNodeFs(this.vfs, this.process)));
    }

    eval(script) {
        this.moduleLoader.runScript(this.entryCwd, script);
    }
}