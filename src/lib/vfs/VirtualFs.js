import VirtualPath from './VirtualPath';

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

export class VirtualFs {
  constructor() {
    this.root = new MemoryDirectory('');
  }


  resolve(cwd, path) {
    return VirtualPath.resolve(cwd, path);
  }

  _resolveExplode(cwd, file) {
    return VirtualPath.explode(this.resolve(cwd, file)).components;
  }
  getItemUnchecked(cwd, file) {
    const components = this._resolveExplode(cwd, file);
    var item = this.root;
    components.forEach(component => {
      item = item && item.getItemUnchecked(component);
    });
    return item;
  }

  getItemChecked(cwd, file) {
    const item = this.getItemUnchecked(cwd, file);
    if (!item) throw new Error("Fs item  not found: " + file);
    return item;
  }

  readFileSync(cwd, file) {
    const item = this.getItemChecked(cwd, file);
    if (item.type !== 'file') {
      throw new Error("readFileSync: not a file");
    }
    return item.contents;
  };

  mkdir(cwd, path) {
    const components = this._resolveExplode(cwd, path);
    var item = this.root;
    components.forEach(component => {
      var nextItem = item.getItem(component);
      if (nextItem){
        if (nextItem.type !== 'directory') {
          throw new Error("mkdir filename taken: " + path);
        }
      } else {
        nextItem = new MemoryDirectory(component);
        item.setItem(nextItem);
      }
      item = nextItem;
    });
    return item;
  }

  fileExists(cwd, file) {
    return !!this.getItemUnchecked(cwd, file);
  };
}