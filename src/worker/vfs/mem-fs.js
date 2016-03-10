export class MemoryDirectory  {
    constructor(name) {
        this.name = name;
        this.type = "directory";
        this.items = new Map();
    }

    getItem(name, type) {
        if (type) console.warn("type used at MemoryDirectory.getItem");
        return this.items.get(name) || null;
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
