
export class ProcessObject {
    constructor(bindings, cwd = "/user/", platform = "browser") {
        this.platform = platform;
        this._bindings = bindings;
        this._state = { cwd };
    }

    cwd() {
        return this._state.cwd;
    }

    chdir(path) {
        this._state.cwd = path;
    }
}