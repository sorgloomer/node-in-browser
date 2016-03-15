
import * as Path from "../vfs/path";

export default class Binding {
    constructor(vfs, exe, cwd) {
        this.path = Path;
        this.vfs = vfs;
        this.cwd = cwd;
        this.executable = exe;
    }
}
