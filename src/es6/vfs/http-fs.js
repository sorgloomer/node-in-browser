import { fetchBytesSync, fetchJsonSync } from './fetch-sync';

const DIR_SUFFIX = "/.dir-data";

function fetch_dir(root) {
  const items = new Map();
  const data = fetchJsonSync(root + DIR_SUFFIX);
  data.files.forEach(f => {
    items.set(f, new HttpFile(root + "/" + f, f));
  });
  data.directories.forEach(f => {
    items.set(f, new HttpDirectory(root + "/" + f, f));
  });
  return items;
}

export class HttpDirectory {
  constructor(root_uri, name)
  {
    this.name = name;
    this.type = "directory";
    this._root_uri = root_uri;
    this._items = null;
  }

  _fetch() {
    return fetch_dir(this._root_uri);
  }
  get items() {
    return this._items || (this._items = this._fetch());
  }

  getItem(name) {
    return this.items.get(name);
  }
  setItem(item) {
    this.items.set(item.name, item);
  }
  getItems() {
    return Array.from(this.items.values());
  }
}

export class HttpFile {
  constructor(root_uri, name)
  {
    this.name = name;
    this.type = "file";
    this._root_uri = root_uri;
    this._contents = null;
  }
  _fetch() {
    return fetchBytesSync(this._root_uri);
  }
  get contents() {
    return this._contents || (this._contents = this._fetch());
  }
  set contents(value) {
    if (!(value instanceof Uint8Array)) throw new Error("File.contents must be Uint8Array");
    this._contents = value;
  }
}
