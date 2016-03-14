import { fetchSync, fetchJsonSync } from './fetch-sync';

const DIR_SUFFIX = "/dir-listing";

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
    return this.items.get(name) || null;
  }
  setItem(item) {
    this.items.set(item.name, item);
  }
  removeItem(name) {
    this.items.delete(name);
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
    this._content = null;
  }
  _fetch() {
    return fetchSync(this._root_uri);
  }
  get content() {
    return this._content || (this._content = this._fetch());
  }
  set content(value) {
    this._content = value;
  }
}
