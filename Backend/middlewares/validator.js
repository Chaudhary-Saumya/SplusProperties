const { validationResult } = require('express-validator');
const ErrorResponse = require('../utils/errorResponse');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const extractedErrors = [];
    errors.array().map(err => extractedErrors.push(err.msg));

    return next(new ErrorResponse(extractedErrors.join(', '), 400, 'VALIDATION_ERROR'));
};

module.exports = validate;
