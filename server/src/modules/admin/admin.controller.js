const adminService = require('./admin.service');

exports.getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    
    const filters = {
      search: req.query.search,
      isActive: req.query.isActive
    };
    
    const result = await adminService.getUsers(filters, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.deactivateUser = async (req, res, next) => {
  try {
    const adminUserId = req.user.id;
    const targetUserId = req.params.id;
    
    const updatedUser = await adminService.deactivateUser(adminUserId, targetUserId);
    res.status(200).json({ success: true, data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};

exports.reactivateUser = async (req, res, next) => {
  try {
    const adminUserId = req.user.id;
    const targetUserId = req.params.id;
    
    const updatedUser = await adminService.reactivateUser(adminUserId, targetUserId);
    res.status(200).json({ success: true, data: { user: updatedUser } });
  } catch (error) {
    next(error);
  }
};

exports.getCsvImports = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;
    const status = req.query.status || 'FAILED';
    
    const result = await adminService.getCsvImports(status, page, limit);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

exports.getMetrics = async (req, res, next) => {
  try {
    const metrics = await adminService.getMetrics();
    res.status(200).json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};
