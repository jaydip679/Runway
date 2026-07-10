const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');
const alertsService = require('./alerts.service');
const AppError = require('../../common/errors/AppError');

const getAlerts = catchAsync(async (req, res) => {
  const { isRead, limit, cursor } = req.query;
  const { alerts, nextCursor } = await alertsService.getAlerts(req.user.id, {
    isRead,
    limit,
    cursor,
  });

  sendSuccess(res, alerts, { nextCursor });
});

const markAlertRead = catchAsync(async (req, res) => {
  const { id } = req.params;
  const success = await alertsService.markAlertRead(req.user.id, id);
  
  if (!success) {
    throw new AppError('Alert not found', 404, 'ALERT_NOT_FOUND');
  }

  sendSuccess(res, { success: true });
});

module.exports = {
  getAlerts,
  markAlertRead,
};
