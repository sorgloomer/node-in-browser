
export function normalize(path) {
  path = path.replace(/[\\\/]+/g, '/');

  return repeatUntilSettled('' + path, iterate);

  function repeatUntilSettled(inp, fn) {
    for(;;) {
      var np = fn(inp);
      if (np === inp) return np;
      inp = np;
    }
  }

  function iterate(path) {
    return (path
        .replace(/[\\\/]+/g, '/')
        .replace(/[\/]\.(\/|$)/g, (_, a) => a || '')
        .replace(/(^|\/)[^\/]*\/\.\.($|\/)/g, (_, a, b) => a + b));
  }
}

export function combine(...args) {
  return args.join('/');
}

export function isRelative(path) {
  return !isAbsolute(path);
}
export function isAbsolute(path) {
  return /^[\\\/]/.test(path);
}

export function resolve(path, ...parts) {
  return parts.reduce((path, part) => isAbsolute(part) ? part : normalize(path + '/' + part),  normalize(path));
}

export function explode(path) {
  return {
    relative: isRelative(path),
    components: path.split(/[\\\/]+/g).filter(i=>i)
  };
}

export function isLocal(path) {
  return /^(?:\.|\.\.)(?:\\|\/|$)/.test(path);
}

export function isGlobal(path) {
  return !isLocal(path);
}

export function getParent(path) {
  const m = /^(.*)[\\\/][^\\\/]+[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

export function getFileName(path) {
  const m = /[\\\/]([^\\\/]+)[\\\/]*$/.exec(path);
  return m ? m[1] : path;
}

export function getFileNameWithoutExt(path) {
  const fn = getFileName(path);
  const ext = getExt(fn);
  return fn.substring(0, fn.length - ext.length);
}

export function getExt(path) {
  return /\.[^\.\\\/]$/.exec(path) || '';
}
