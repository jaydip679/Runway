const { redis } = require('./src/config/redis');
const prisma = require('./src/config/db');

afterAll(async () => {
  // Disconnect Redis
  if (redis.status === 'ready' || redis.status === 'connecting') {
    redis.disconnect();
  }
  
  // Disconnect Prisma
  await prisma.$disconnect();
});
