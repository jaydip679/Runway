const sendSuccess = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    status: 'success',
    message,
    ...(data && { data }),
  });
};

const sendError = (res, statusCode, errorCode, message) => {
  res.status(statusCode).json({
    status: 'error',
    error: {
      code: errorCode,
      message,
    }
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
