const { PrismaClient } = require('@prisma/client');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const metrics = require('../../common/utils/metrics');
const { csvImportQueue } = require('../../jobs/queues/csvImport.queue');
const { notificationQueue } = require('../../jobs/queues/notification.queue');
const { recurringDetectionQueue } = require('../../jobs/queues/recurringDetection.queue');
const { forecastQueue } = require('../../jobs/queues/forecast.queue');

const prisma = new PrismaClient();

exports.getUsers = async (filters, page = 1, limit = 50) => {
  const { search, isActive } = filters;
  const skip = (page - 1) * limit;

  const where = {};
  
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // T9.2 — Explicit allow-list to avoid leaking passwordHash or financial data
  const users = await prisma.user.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  const totalCount = await prisma.user.count({ where });

  return {
    users,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  };
};

exports.deactivateUser = async (adminUserId, targetUserId) => {
  if (adminUserId === targetUserId) {
    throw new AppError('Admin cannot deactivate self', 422, errorCodes.VALIDATION_ERROR);
  }

  const user = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!user) {
    throw new AppError('User not found', 404, errorCodes.NOT_FOUND);
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive: false },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      isEmailVerified: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  return updatedUser;
};

exports.getCsvImports = async (status = 'FAILED', page = 1, limit = 50) => {
  const skip = (page - 1) * limit;

  const where = { status };

  const imports = await prisma.csvImportJob.findMany({
    where,
    skip,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      }
    }
  });

  const totalCount = await prisma.csvImportJob.count({ where });

  return {
    imports,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit)
  };
};

exports.getMetrics = async () => {
  // Total user count
  const totalUsers = await prisma.user.count();

  // Active user count (logged in within the last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const activeUsers = await prisma.user.count({
    where: {
      lastLoginAt: {
        gte: sevenDaysAgo
      }
    }
  });

  // Fetch BullMQ job counts safely
  const safeGetJobCounts = async (queue, queueName) => {
    try {
      if (!queue) return { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 };
      return await queue.getJobCounts('waiting', 'active', 'completed', 'failed', 'delayed');
    } catch (error) {
      return { error: 'Failed to fetch queue metrics', queueName };
    }
  };

  const queueMetrics = {
    csvImportQueue: await safeGetJobCounts(csvImportQueue, 'csvImportQueue'),
    notificationQueue: await safeGetJobCounts(notificationQueue, 'notificationQueue'),
    recurringDetectionQueue: await safeGetJobCounts(recurringDetectionQueue, 'recurringDetectionQueue'),
    forecastQueue: await safeGetJobCounts(forecastQueue, 'forecastQueue'),
  };

  // Trailing hour error rate from metrics.js
  const apiMetrics = metrics.getTrailingHourMetrics();

  return {
    users: {
      total: totalUsers,
      active7d: activeUsers
    },
    queues: queueMetrics,
    api: apiMetrics
  };
};
