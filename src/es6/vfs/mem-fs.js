export class MemoryDirectory  {
    constructor(name) {
        this.name = name;
        this.type = "directory";
        this._items = new Map();
    }

    getItem(name, type = null) {
        const res = this._items.get(name);
        if (type && (!res || res.type !== type)) {
            throw new Error("Item type mismatch");
        }
        return res;
    }

    getItems() {
        return Array.from(this._items.values());
    }

    setItem(item) {
        this._items.set(item.name, item);
    }
}

export class MemoryFile {
    constructor(name, contents) {
        if (!(contents instanceof Uint8Array)) throw new Error("MemoryFile contents must be Uint8Array");

        this.name = name;
        this.type = "file";
        this.contents = contents;
    }
}
