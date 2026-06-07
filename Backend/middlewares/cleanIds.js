const cleanDirtyObjectId = (val) => {
    if (typeof val === 'string') {
        const match = val.match(/^([0-9a-fA-F]{24})([\s%].*)?$/);
        if (match) {
            return match[1];
        }
    }
    return val;
};

const isIdKey = (key) => {
    return /id$/i.test(key) || 
           /createdBy/i.test(key) || 
           /tokenedBy/i.test(key) || 
           /verifiedBy/i.test(key) ||
           key === 'listing' ||
           key === 'user';
};

const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                if (isIdKey(key)) {
                    obj[key] = cleanDirtyObjectId(obj[key]);
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        }
    }
};

module.exports = (req, res, next) => {
    if (req.params) {
        sanitizeObject(req.params);
    }
    if (req.body) {
        sanitizeObject(req.body);
    }
    if (req.query) {
        sanitizeObject(req.query);
    }
    next();
};
