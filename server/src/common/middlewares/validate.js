const AppError = require('../errors/AppError');

const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    req.body = parsed.body || req.body;
    req.query = parsed.query || req.query;
    req.params = parsed.params || req.params;
    next();
  } catch (err) {
    const details = err.errors.map(e => ({ field: e.path.join('.'), message: e.message }));
    next(new AppError('Validation failed', 400, 'VALIDATION_ERROR', details));
  }
};

module.exports = validate;
