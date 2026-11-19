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
 * Normalizes route path to avoid high cardinality in Prometheus metrics
 * e.g., /api/v1/transactions/458f0d8b-ff66-4ca5-90c5-0e4a4fc698bd -> /api/v1/transactions/:id
 */
const normalizeRoute = (rawPath) => {
  if (!rawPath) return 'unknown';
  return rawPath
    .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ':id')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\?.*$/, '');
};

/**
 * Verifies if request originates from localhost / loopback or carries an internal auth token.
 * Note: Hostname-based checks (e.g. req.hostname === 'localhost') are strictly avoided
 * to prevent Host header spoofing attacks.
 */
const isInternalRequest = (req) => {
  const rawIp = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || '';
  const ip = rawIp.replace(/^::ffff:/, ''); // Normalize IPv4-mapped IPv6 addresses

  const isLoopbackIp =
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('127.');

  if (isLoopbackIp) return true;

  // Optional bearer/header token for authenticated internal scrapers (e.g. Grafana Alloy)
  const configuredToken = process.env.METRICS_TOKEN;
  if (configuredToken && req.headers['x-metrics-token'] === configuredToken) {
    return true;
  }

  // In test environment, allow test invocations only if explicitly mocked
  if (process.env.NODE_ENV === 'test') {
    return false;
  }

  return false;
};

/**
 * Middleware to record HTTP latency and throughput metrics
 */
const metricsMiddleware = (req, res, next) => {
  if (req.path === '/metrics' || req.path === '/health' || req.path === '/health/ready') {
    return next();
  }

  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    
    const rawRoute = req.route ? req.baseUrl + req.route.path : req.baseUrl || req.path;
    const route = normalizeRoute(rawRoute);
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
 * Handler for the /metrics scraping endpoint (restricted to localhost/internal scrapers)
 */
const getMetrics = async (req, res) => {
  if (!isInternalRequest(req)) {
    return res.status(403).send('Access Denied: Internal Metrics Only');
  }

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
  normalizeRoute,
  isInternalRequest,
};
