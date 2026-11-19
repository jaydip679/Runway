const client = require('prom-client');

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'runway-api',
  env: process.env.NODE_ENV || 'development',
});

// Enable the collection of default Node.js runtime metrics
client.collectDefaultMetrics({ register });

// HTTP Request Duration Histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
register.registerMetric(httpRequestDuration);

// Total HTTP Requests Counter
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status_code'],
});
register.registerMetric(httpRequestsTotal);

/**
 * Middleware to record HTTP latency and throughput metrics
 */
const metricsMiddleware = (req, res, next) => {
  // Ignore the /metrics endpoint itself to prevent metric pollution
  if (req.path === '/metrics' || req.path === '/health' || req.path === '/health/ready') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    // Normalize parameterized route path if available, or fallback to base path
    const route = req.route ? req.baseUrl + req.route.path : req.baseUrl || req.path;
    const statusCode = res.statusCode.toString();

    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      durationInSeconds
    );
    httpRequestsTotal.inc({ method: req.method, route, status_code: statusCode });
  });

  next();
};

/**
 * Handler for the /metrics scraping endpoint
 */
const getMetrics = async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (err) {
    res.status(500).send(err.message);
  }
};

module.exports = {
  register,
  metricsMiddleware,
  getMetrics,
};
