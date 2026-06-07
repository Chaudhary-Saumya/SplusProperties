const ErrorResponse = require('../utils/errorResponse');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new ErrorResponse(message, 404, 'RESOURCE_NOT_FOUND');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    let message = 'Duplicate field value entered';
    if (err.keyValue) {
      const field = Object.keys(err.keyValue)[0];
      message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists. Please use another one.`;
    }
    error = new ErrorResponse(message, 400, 'DUPLICATE_KEY');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400, 'VALIDATION_ERROR');
  }

  const statusCode = error.statusCode || 500;
  const errorCode = error.errorCode || 'SERVER_ERROR';

  // Log error: Log actual 500 internal errors as errors, but client input errors as info/warnings
  if (statusCode === 500) {
    logger.error(err);
  } else {
    logger.warn(`${req.method} ${req.originalUrl} - ${statusCode} [${errorCode}]: ${error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Server Error',
    errorCode: errorCode
  });
};

module.exports = errorHandler;
