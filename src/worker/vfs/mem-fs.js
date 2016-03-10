export class MemoryDirectory  {
    constructor(name) {
        this.name = name;
        this.type = "directory";
        this.items = new Map();
    }

    getItem(name, type = null) {
        const res = this.items.get(name);
        if (type && (!res || res.type !== type)) {
            throw new Error("Item type mismatch");
        }
        return res;
    }

    getItems() {
        return Array.from(this.items.values());
    }

    setItem(item) {
        this.items.set(item.name, item);
    }
    removeItem(name) {
        this.items.delete(name);
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
