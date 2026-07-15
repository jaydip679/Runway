require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const env = require('../config/env');
const logger = require('../config/logger');

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    const { ADMIN_SEED_EMAIL, ADMIN_SEED_PASSWORD } = env;
    
    logger.info(`Checking for existing admin user with email: ${ADMIN_SEED_EMAIL}`);
    const existingAdmin = await prisma.user.findUnique({
      where: { email: ADMIN_SEED_EMAIL }
    });

    if (existingAdmin) {
      if (existingAdmin.role === 'ADMIN') {
        logger.info('Admin user already exists. Seed skipped.');
      } else {
        logger.warn(`User with email ${ADMIN_SEED_EMAIL} exists but is not an ADMIN. Upgrading to ADMIN.`);
        await prisma.user.update({
          where: { id: existingAdmin.id },
          data: { role: 'ADMIN' }
        });
        logger.info('User upgraded to ADMIN.');
      }
      process.exit(0);
    }

    logger.info('Creating new admin user...');
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(ADMIN_SEED_PASSWORD, salt);

    await prisma.user.create({
      data: {
        email: ADMIN_SEED_EMAIL,
        name: 'System Admin',
        passwordHash,
        role: 'ADMIN',
        isEmailVerified: true,
        authProvider: 'LOCAL',
      }
    });
    
    logger.info('Successfully created seed admin user.');
    process.exit(0);
  } catch (error) {
    logger.error('Failed to seed admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
