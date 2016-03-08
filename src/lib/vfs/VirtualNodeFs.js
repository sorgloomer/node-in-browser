import VirtualPath from './VirtualPath';


export class VirtualNodeFs {
  constructor(vfs, process) {
    this._vfs = vfs;
    this._process = process;
  }

  storeText(path, text) {
    this._vfs.storeText(this._process.cwd(), path, text);
  }
  loadText(path) {
    return this._vfs.loadText(this._process.cwd(), path);
  }
}
