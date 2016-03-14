import * as Path from './path';
import { MemoryDirectory, MemoryFile } from './mem-fs';



function any_to_text(x) {
  if (typeof x === "string") {
    return x;
  } else if (x instanceof Uint8Array) {
    const decoder = new TextDecoder();
    return decoder.decode(x);
  } else {
    throw new Error("cant convert content");
  }
}

function any_to_bytes(x) {
  if (typeof x === "string") {
    const decoder = new TextEncoder();
    return decoder.encode(x);
  } else if (x instanceof Uint8Array) {
    return x;
  } else {
    throw new Error("cant convert content");
  }
}


function any_to_any(x, type) {
  switch (type) {
    case 'text':
      return any_to_text(x);
    case 'bytes':
      return any_to_bytes(x);
    default:
      throw new Error("unknown type: " + type);
  }
}

export class VirtualFs {
  constructor() {
    this.root = new MemoryDirectory('');
  }


  resolve(cwd, path) {
    return Path.resolve(cwd, path);
  }

  _resolveExplode(cwd, file) {
    return Path.explode(this.resolve(cwd, file)).components;
  }

  getContent(cwd, file) {
    const item = this.getItem(cwd, file, false);
    return this.getContentOf(item);
  }
  getContentOf(item) {
    return item && item.type === 'file' ? item.content : null;
  }
  getContentOfAs(item, type) {
    const data = this.getContentOf(item);
    if (data === null) return null;
    return any_to_any(data, type);
  }
  getContentText(cwd, file) {
    return this.getContentAs(cwd, file, 'text');
  }
  getContentBytes(cwd, file) {
    return this.getContentAs(cwd, file, 'bytes');
  }
  getContentAs(cwd, file, type) {
    const data = this.getContent(cwd, file);
    if (data === null) return null;
    return any_to_any(data, type);
  }


  getItem(cwd, file, checked, type = null) {
    const resolved = Path.resolve(cwd, file);
    const components = Path.explode(resolved).components;
    var item = this.root;

    const comp_len_dec = components.length - 1;
    if (comp_len_dec >= 0) {
      for (let i = 0; i < comp_len_dec; i++) {
        const component = components[i];
        item = item && item.getItem(component);
        if (item && item.type !== "directory") {
          throw new Error("Path contains files: " + resolved);
        }
        check();
      }
      item = item && item.getItem(components[comp_len_dec]);
      check();
    }
    if (type && item && item.type !== type) {
      throw new Error("VirtualFs.getItem item type mismatch: " + resolved);
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
    return this._vfs.getContentOfAs(item, 'bytes');
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

  removeItem(cwd, path, testFn = null) {
    const name = Path.getFileName(path);
    const parent = this.getDirectory(cwd, Path.getParent(path), true);
    const item = parent.getItem(name);
    if (!testFn || testFn(item)) {
      parent.removeItem(name);
    }
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

  createDirectory(parent, name) {
    name = String(name);
    const item = parent.getItem(name);
    if (item) {
      if (item.type !== 'directory') {
        throw new Error("A file with that name already exists");
      }
    } else {
      parent.setItem(new MemoryDirectory(name));
    }
  }
}