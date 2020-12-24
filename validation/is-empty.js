module.exports = value => {
  if (value === undefined) return true;
  if (value === null) return true;
  if (typeof value === 'object') {
    if (Object.keys(value).length === 0) return true;
    let isEmpty = true;
    Object.keys(value).forEach(key => {
      if (value[key].length > 0) {
        isEmpty = false;
      }
    });
    return isEmpty;
  }
  if (typeof value === 'string' && value.trim().length === 0) return true;
};
