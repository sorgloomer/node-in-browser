

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
    return path
      .replace(/[\\\/]+/g, '/')
      .replace(/[\\\/]\.(?:$|\\|\/)/g, '')
      .replace(/(?:^|\\|\/)[^\\\/]*[\\\/]\.\.(?:$|\\|\/)/g, '');
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
    components: path.split(/[\\\/]+/g)
  };
}

export default {
  combine, normalize, explode, isRelative, resolve
};