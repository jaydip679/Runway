const prisma = require('../../config/db');
const { getSoftDeleteFilter } = require('../../common/utils/softDelete');
const { notificationQueue } = require('../../jobs/queues/notification.queue');

/**
 * Creates an alert if it does not already exist.
 * Relies on the database-level UNIQUE constraint to handle deduplication.
 */
const createAlertIfNotDuplicate = async ({
  userId,
  type,
  relatedEntityType,
  relatedEntityId,
  relevantDate,
  message,
  severity,
}) => {
  try {
    const alert = await prisma.alert.create({
      data: {
        userId,
        type,
        relatedEntityType,
        relatedEntityId,
        relevantDate,
        message,
        severity,
      },
    });

    return alert;
  } catch (error) {
    // Prisma unique constraint violation code is P2002
    if (error.code === 'P2002') {
      // It's a duplicate, treat as a successful no-op
      return null;
    }
    throw error;
  }
};

const getAlerts = async (userId, { isRead, limit = 50, cursor }) => {
  const where = { userId };
  
  if (isRead !== undefined) {
    where.isRead = isRead === 'true' || isRead === true;
  }

  const queryArgs = {
    where,
    take: Number(limit) + 1,
    orderBy: { createdAt: 'desc' },
  };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
  }

  const alerts = await prisma.alert.findMany(queryArgs);
  
  let nextCursor = null;
  if (alerts.length > limit) {
    const nextItem = alerts.pop();
    nextCursor = nextItem.id;
  }

  return {
    alerts,
    nextCursor,
  };
};

const markAlertRead = async (userId, alertId) => {
  // Use updateMany so it doesn't throw if the alert doesn't exist or doesn't belong to the user
  const result = await prisma.alert.updateMany({
    where: {
      id: alertId,
      userId,
    },
    data: {
      isRead: true,
    },
  });

  return result.count > 0;
};

module.exports = {
  createAlertIfNotDuplicate,
  getAlerts,
  markAlertRead,
};
