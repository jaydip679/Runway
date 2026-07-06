const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
const env = require('./config/env');
const logger = require('./config/logger');
const prisma = require('./config/db');
const redis = require('./config/redis');
const errorHandler = require('./common/middlewares/errorHandler');
const requestLogger = require('./common/middlewares/requestLogger');
const createRateLimiter = require('./common/middlewares/rateLimiter');

const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const accountRoutes = require('./modules/accounts/account.routes');
const categoryRoutes = require('./modules/categories/category.routes');

const app = express();

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Middlewares
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(requestLogger);

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Global Rate Limiter
const globalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
});
app.use('/api', globalLimiter);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/accounts', accountRoutes);
app.use('/api/v1/categories', categoryRoutes);

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Deep health check
app.get('/health/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await redis.ping();
    res.status(200).json({ status: 'ready', database: 'connected', redis: 'connected' });
  } catch (error) {
    logger.error('Health check failed', error);
    res.status(503).json({ status: 'error', message: 'Service unavailable' });
  }
});

// Global error handler
app.use(errorHandler);

module.exports = app;
