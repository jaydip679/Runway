const { enqueueExportJob } = require('../../jobs/queues/export.queue');
const prisma = require('../../config/db');
const catchAsync = require('../../common/utils/catchAsync');
const { sendSuccess } = require('../../common/utils/apiResponse');
const { getTempPdfPath } = require('../storage/storage.service');

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

  // Check if temporary file still exists
  const filename = doc.cloudPublicId;
  const filePath = getTempPdfPath(filename);

  if (!filePath) {
    return res.status(410).json({ 
      success: false, 
      error: { message: 'Export has expired (10 minutes limit). Please generate a new one.' } 
    });
  }

  // Set appropriate headers and send the file directly
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${doc.title}.pdf"`);
  return res.sendFile(filePath);
});

module.exports = {
  requestExport,
  getDocument
};
