const { enqueueExportJob } = require('../../jobs/queues/export.queue');
const prisma = require('../../config/db');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');

const requestExport = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { filters } = req.body; // { startDate, endDate, accountId, categoryId, type }
  
  // Enqueue job
  await enqueueExportJob(userId, filters || {});
  
  return sendSuccess(res, { message: 'Export job queued successfully. You will receive an alert when it is ready.' }, 202);
});

const getDocument = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { documentId } = req.params;

  const doc = await prisma.exportDocument.findUnique({
    where: { id: documentId }
  });

  if (!doc) {
    return res.status(404).json({ success: false, error: { message: 'Document not found' } });
  }

  // Validate ownership
  if (doc.userId !== userId) {
    return res.status(403).json({ success: false, error: { message: 'Unauthorized access to document' } });
  }

  // Return the secure URL to the frontend so it can open it
  return sendSuccess(res, { secureUrl: doc.secureUrl, title: doc.title });
});

module.exports = {
  requestExport,
  getDocument
};
