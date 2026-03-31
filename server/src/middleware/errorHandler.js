function errorHandler(err, req, res, next) {
  console.error(err);

  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate value detected',
      error: err.keyValue,
    });
  }

  return res.status(err.statusCode || 500).json({
    message: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
