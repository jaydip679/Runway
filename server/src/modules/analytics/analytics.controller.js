const analyticsService = require('./analytics.service');

exports.getCashFlow = async (req, res, next) => {
  try {
    const cashFlow = await analyticsService.getCashFlow(req.user.id, req.query);
    res.status(200).json({ success: true, data: { cashFlow } });
  } catch (error) {
    next(error);
  }
};

exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await analyticsService.getCategoryBreakdown(req.user.id, req.query);
    res.status(200).json({ success: true, data: { breakdown } });
  } catch (error) {
    next(error);
  }
};
