

function normalize(path) {
  return repeatUntilSettled('' + path, iterate);

  function repeatUntilSettled(inp, fn) {
    for(;;) {
      var np = fn(inp);
      if (np === inp) return np;
      inp = np;
    }
  }

  function iterate(path) {
    path = path.replace(/[\\\/]+/g, '/');
    path = path.replace(/[\/]\.$/, '');
    path = path.replace(/[\/]\.\//g, '/');
    path = path.replace(/(^|\/)[^\/]*\/\.\.($|\/)/g, (a, b, c) => b + c);
    return path;
  }
}

function combine(...args) {
  return args.join('/');
}

function isRelative(path) {
  return /^[^\\\/]/.test(path);
}

function resolve(cwd, path) {
  return normalize(isRelative(path) ? combine(cwd, path) : path);
}

function explode(path) {
  return {
    relative: isRelative(path),
    components: path.split(/[\\\/]+/g).filter(i=>i)
  };
}

function isRelativeOrAbsolute(path) {
  return /^(?:\.|\.\.)(?:\\|\/|$)/.test(path);
}

function getParent(path) {
  const m = /^(.*)[\\\/][^\\\/]+[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

function getFileName(path) {
  const m = /[\\\/]([^\\\/]+)[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

export default {
  combine, normalize, explode, isRelative, resolve, isRelativeOrAbsolute, getParent, getFileName
};