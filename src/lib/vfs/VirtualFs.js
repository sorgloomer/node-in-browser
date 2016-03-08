import VirtualPath from './VirtualPath';

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
  getItem(cwd, file, checked, type = null) {
    const components = this._resolveExplode(cwd, file);
    var item = this.root;

    const comp_len_dec = components.length - 1;
    for (let i = 0; i < comp_len_dec; i++) {
      const component = components[i];
      item = item.getItem(component, "directory");
      check();
    }
    item = item.getItem(components[comp_len_dec], type);
    check();
    if (type && item && item.type !== type) {
      throw new Error("VirtualFs.getItem item type mismatch");
    }
    return item;

    function check() {
      if (checked && !item) throw new Error("Fs item  not found: " + file);
    }
  }

  readFileSync(cwd, file) {
    const item = this.getItem(cwd, file, true);
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

  getDirectory(cwd, path, checked = true) {
    return this.getItem(cwd, path, checked, 'directory');
  }
  getFile(cwd, path, checked = true) {
    return this.getItem(cwd, path, checked, 'file');
  }

  storeBytes(cwd, path, content) {
    this.mkdir(cwd, VirtualPath.getParent(path)).setItem(new MemoryFile(VirtualPath.getFileName(path), content));
  }
  storeText(cwd, path, content) {
    const encoder = new TextEncoder('utf-8');
    this.storeBytes(cwd, path, encoder.encode(content));
  }
  loadBytes(cwd, path) {
    return this.getFile(cwd, path, true).contents;
  }
  loadText(cwd, path) {
    const decoder = new TextDecoder('utf-8');
    return decoder.decode(this.loadBytes(cwd, path));
  }

  itemExists(cwd, file) {
    return !!this.getItem(cwd, file, false);
  };
  isItemType(cwd, path, type) {
    const item = this.getItem(cwd, path, false);
    return !!(item && item.type === type);
  }
  isFile(cwd, path) {
    return this.isItemType(cwd, path, 'file');

  }
}