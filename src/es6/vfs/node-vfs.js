import { VirtualFs } from './virtual-fs';

// We manipulate prototype in the old way, so not using class here
export function VirtualNodeFs(process, vfs = new VirtualFs()) {
  this._vfs = vfs;
  this._process = process;
}

const VirtualNodeFs_prototype = VirtualNodeFs.prototype;

VirtualNodeFs_prototype.storeText = function storeText(path, text) {
  this._vfs.storeText(this._process.cwd(), path, text);
};

VirtualNodeFs_prototype.loadText = function loadText(path) {
  return this._vfs.loadText(this._process.cwd(), path);
};
