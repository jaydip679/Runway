const { Worker } = require('bullmq');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const prisma = require('../../config/db');
const { uploadPdf, getTempPdfPath } = require('../../modules/storage/storage.service');
const { enqueuePdfCleanup } = require('./export.queue');

const connection = {
  url: process.env.REDIS_URL,
};

const exportWorker = new Worker('pdf-export', async (job) => {
  const { userId, filters } = job.data;
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  // Build query
  const where = { userId, deletedAt: null };
  if (filters.accountId) where.accountId = filters.accountId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.startDate || filters.endDate) {
    where.transactionDate = {};
    if (filters.startDate) where.transactionDate.gte = new Date(filters.startDate);
    if (filters.endDate) where.transactionDate.lte = new Date(filters.endDate);
  }
  
  // Also filter type if requested
  if (filters.type) where.type = filters.type;

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { transactionDate: 'desc' },
    include: { account: true, category: true }
  });

  // Calculate summaries
  let totalIncome = 0;
  let totalExpense = 0;
  for (const tx of transactions) {
    if (tx.type === 'INCOME') totalIncome += Number(tx.amount);
    if (tx.type === 'EXPENSE') totalExpense += Number(tx.amount);
  }

  // Generate PDF locally
  const tmpFilePath = path.join(os.tmpdir(), `export_${userId}_${Date.now()}.pdf`);
  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(tmpFilePath);
  doc.pipe(stream);

  // --- PDF CONTENT ---
  // Header
  doc.fontSize(20).text('Runway Financial Statement', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Generated for: ${user.name} (${user.email})`);
  doc.text(`Date: ${new Date().toLocaleDateString()}`);
  doc.moveDown();

  // Summary
  doc.fontSize(16).text('Summary');
  doc.fontSize(12)
     .text(`Total Income: $${totalIncome.toFixed(2)}`)
     .text(`Total Expense: $${totalExpense.toFixed(2)}`);
  doc.moveDown();

  // Transactions Table Header
  doc.fontSize(16).text('Transactions');
  doc.moveDown(0.5);
  doc.fontSize(10);
  
  const drawRow = (y, date, desc, category, account, amount, type) => {
    doc.text(date, 50, y, { width: 70 });
    doc.text(desc, 120, y, { width: 150 });
    doc.text(category, 270, y, { width: 100 });
    doc.text(account, 370, y, { width: 80 });
    doc.text((type === 'INCOME' ? '+' : '-') + '$' + amount, 450, y, { width: 70, align: 'right' });
  };

  let currentY = doc.y;
  doc.font('Helvetica-Bold');
  drawRow(currentY, 'Date', 'Description', 'Category', 'Account', 'Amount', 'Type');
  currentY += 15;
  doc.moveTo(50, currentY).lineTo(520, currentY).stroke();
  currentY += 10;
  
  doc.font('Helvetica');
  
  for (const tx of transactions) {
    if (currentY > 700) {
      doc.addPage();
      currentY = 50;
      doc.font('Helvetica-Bold');
      drawRow(currentY, 'Date', 'Description', 'Category', 'Account', 'Amount', 'Type');
      currentY += 15;
      doc.moveTo(50, currentY).lineTo(520, currentY).stroke();
      currentY += 10;
      doc.font('Helvetica');
    }
    
    drawRow(
      currentY, 
      tx.transactionDate.toISOString().split('T')[0], 
      tx.description.substring(0, 25), 
      tx.category?.name || 'Uncategorized', 
      tx.account.name, 
      Number(tx.amount).toFixed(2), 
      tx.type
    );
    currentY += 15;
  }

  doc.end();

  // Wait for stream to finish
  await new Promise((resolve, reject) => {
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  // Upload to local temp storage
  const uploadResult = await uploadPdf(tmpFilePath);
  const filename = uploadResult.filename;

  // Create ExportDocument record (DB is source of truth, file is temp)
  const exportDoc = await prisma.exportDocument.create({
    data: {
      userId,
      title: `Statement ${new Date().toLocaleDateString()}`,
      cloudPublicId: filename, // Repurposing this field to store the filename
      secureUrl: '' // Not used anymore
    }
  });

  // Schedule cleanup job after 10 minutes
  await enqueuePdfCleanup(filename);

  // Create Alert Notification
  await prisma.alert.create({
    data: {
      userId,
      type: 'EXPORT_READY',
      message: `Your requested PDF Statement is ready for download!`,
      severity: 'INFO',
      relatedEntityType: 'EXPORT_DOCUMENT',
      relatedEntityId: exportDoc.id
    }
  });

  // Note: I will update schema.prisma AlertType to include EXPORT_READY.

}, { connection });

exportWorker.on('failed', (job, err) => {
  console.error(`Export Job ${job.id} failed:`, err.message);
});

const pdfCleanupWorker = new Worker('pdf-cleanup', async (job) => {
  const { filename } = job.data;
  const filePath = getTempPdfPath(filename);
  
  if (filePath) {
    fs.unlinkSync(filePath);
    console.log(`Cleaned up temporary PDF: ${filename}`);
  }
}, { connection });

pdfCleanupWorker.on('failed', (job, err) => {
  console.error(`PDF Cleanup Job ${job.id} failed:`, err.message);
});

module.exports = {
  exportWorker,
  pdfCleanupWorker
};
