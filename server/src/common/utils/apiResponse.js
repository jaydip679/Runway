const sendSuccess = (res, data, meta = undefined, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    ...(data !== undefined && { data }),
    ...(meta !== undefined && { meta }),
  });
};

const sendError = (res, statusCode, errorCode, message, details = undefined) => {
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(details && { details }),
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
