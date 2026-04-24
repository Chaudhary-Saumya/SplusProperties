const sanitize = (v) => {
  if (v instanceof Object) {
    for (var key in v) {
      if (/^\$/.test(key)) {
        delete v[key];
      } else {
        sanitize(v[key]);
      }
    }
  }
  return v;
};

module.exports = (req, res, next) => {
  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params);
  // For Express 5, req.query is read-only for assignment, 
  // but if it's a plain object we can potentially modify its properties.
  // However, it's safer to just sanitize the properties without re-assigning the whole object.
  if (req.query) {
    for (let key in req.query) {
      if (/^\$/.test(key)) {
        delete req.query[key];
      } else if (typeof req.query[key] === 'object') {
        sanitize(req.query[key]);
      }
    }
  }
  next();
};
