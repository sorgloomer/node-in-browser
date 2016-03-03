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
  getItem(cwd, file, checked) {
    const components = this._resolveExplode(cwd, file);
    var item = this.root;
    components.forEach(component => {
      item = item && item.getItem(component);
    });
    if (checked && !item) throw new Error("Fs item  not found: " + file);
    return item;
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

  getItemType(cwd, path, type, checked) {
    const result = this.getItem(cwd, path, checked);
    if (result && result.type !== type) throw new Error("Item is not " + type);
    return result;
  }

  getDirectory(cwd, path, checked) {
    return this.getItemType(cwd, path, 'directory', checked);
  }
  getFile(cwd, path, checked) {
    return this.getItemType(cwd, path, 'file', checked);
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