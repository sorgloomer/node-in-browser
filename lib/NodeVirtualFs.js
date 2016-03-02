import VirtualPath from './VirtualPath';


export class NodeVirtualFs {
  constructor(vfs, process) {

    function resolve(path) {
      return VirtualPath.resolve(process.cwd(), path);
    }

    this.readFileSync = function(file) {
      const { components } = VirtualPath.explode(resolve(file));
      var item = vfs.root;
      components.forEach(component => {
        item = item.getItem(component);
      });
      if (item.type !== 'file') {
        throw new Error("readFileSync: not a file");
      }
      return item.contents;
    };


  }
}
