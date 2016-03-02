export class MemoryDirectory  {
  constructor(name) {
    this.name = name;
    this.type = "directory";
    this.items = new Map();
  }

  getItem(name) {
    return this.items.get(name);
  }

  getItems() {
    return Array.from(this.items.values);
  }

  setItem(item) {
    this.items.set(item.name, item);
  }
}

export class MemoryFile {
  constructor(name, contents) {
    this.name = name;
    this.type = "file";
    this.contents = contents;
  }
}


export class MemoryFs {
  constructor() {
    this.root = new MemoryDirectory('');
  }

}