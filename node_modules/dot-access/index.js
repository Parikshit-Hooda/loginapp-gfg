exports.get = function (obj, path) {
  try {
    return new Function('_', 'return _.' + path)(obj);
  } catch (e) {
    return obj[path];
  }
};

exports.set = function (obj, path, value) {
  var segs = path.split('.');
  segs.reduce(function set(deep, seg, i) {
    return deep[seg] = segs.length - 1 === i
      ? deep[seg] = value
      : deep[seg] || {};
  }, obj);

  return obj;
};