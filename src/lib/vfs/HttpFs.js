export class HttpDirectory {
  constructor(root_uri, name)
  {
    this.name = name;
    this.type = "directory";
    this._root_uri = root_uri;
  }
  getItem(name, type = null) {
    const uri = this._root_uri + "/" + name;
    if (type === 'file') return new HttpFile(uri, name);
    if (type === 'directory') return new HttpDirectory(uri, name);
    throw new Error("HttpDirectory.getItem got unsupported type: " + type);
  }
  setItem(item) {
    throw new Error("Unsupported operation");
  }
  getItems() {
    throw new Error("Unsupported operation");
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
    return fetchSync(this._root_uri);
  }
  get contents() {
    return this._contents || (this._contents = this._fetch());
  }
  set contents(value) {
    throw new Error("Unsupported operation");
  }
}

function ascii_to_bytes(ascii) {
  const res = new Uint8Array(ascii.length);
  for (var i = 0; i < res.length; i++) {
    res[i] = ascii.charCodeAt(i);
  }
  return res;
}
function fetchSync(path) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", path, false);
  xhr.send(null);
  return ascii_to_bytes(xhr.response);
}
