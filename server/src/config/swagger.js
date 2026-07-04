const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Runway API',
      version: '1.0.0',
      description: 'API documentation for the Runway application',
    },
    servers: [
      {
        url: '/api',
        description: 'Current Server',
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
        },
      },
    },
    security: [
      {
        cookieAuth: [],
      },
    ],
  },
  apis: ['./src/modules/**/*.js'],
};

const specs = swaggerJsdoc(options);
module.exports = specs;
