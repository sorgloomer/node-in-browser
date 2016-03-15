

const VERSION = 'v5.7.0';
function Object_entries(x) {
    return Object.keys(x).map(k => [k,x[k]]);
}
module.exports = class Process {
    constructor(binding) {
        this._cwd = binding.cwd;
        this.argv = [binding.executable];
        this.binding = binding;
        this.env = {};
        this.version = VERSION;

        this.stdin = null;
        this.stdout = null;
        this.stderr = null;

        Object_entries(Process.prototype).forEach(([key, value]) => {
            // bind all functions to instance
            if (typeof value === "function") {
                this[key] = value.bind(this);
            }
        });
    }

    nextTick(cb) {
        setTimeout(() => { cb(); }, 0);
    }

    cwd() {
        return this._cwd;
    }
    chdir(rel) {
        this._cwd = this.binding.path.resolve(this._cwd, rel);
    }
};
