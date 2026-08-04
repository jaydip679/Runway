const { Worker } = require('bullmq');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');
const prisma = require('../../config/db');
const { uploadPdf, getTempPdfPath } = require('../../modules/storage/storage.service');
const { enqueuePdfCleanup } = require('./export.queue');
const { createRedisConnection } = require('../../config/redis');

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
  const doc = new PDFDocument({ margin: 0, size: 'A4' });
  const stream = fs.createWriteStream(tmpFilePath);
  doc.pipe(stream);

  // --- PDF CONTENT ---
  const BRAND_COLOR = '#0ea5e9';
  const TEXT_DARK = '#111827';
  const TEXT_LIGHT = '#6b7280';
  const LIGHT_BG = '#f9fafb';

  // Header Banner
  doc.rect(0, 0, 595, 100).fill(BRAND_COLOR);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text('Runway', 50, 35);
  doc.fontSize(14).font('Helvetica').text('Financial Statement', 50, 65);
  
  doc.fontSize(10).text(`Generated for: ${user.name}`, 300, 40, { align: 'right', width: 245 });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 300, 55, { align: 'right', width: 245 });
  doc.text(`Email: ${user.email}`, 300, 70, { align: 'right', width: 245 });

  // Reset margin and position for main content
  doc.y = 130;
  doc.x = 50;

  // Summary Cards
  doc.fillColor(TEXT_DARK).fontSize(16).font('Helvetica-Bold').text('Summary', 50, doc.y);
  doc.moveDown(0.5);

  const summaryY = doc.y;
  
  // Income Box
  doc.rect(50, summaryY, 235, 70).fill(LIGHT_BG).stroke('#e5e7eb');
  doc.fillColor(TEXT_LIGHT).fontSize(10).font('Helvetica').text('Total Income', 65, summaryY + 15);
  doc.fillColor('#10b981').fontSize(18).font('Helvetica-Bold').text(`Rs. ${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 65, summaryY + 35);

  // Expense Box
  doc.rect(310, summaryY, 235, 70).fill(LIGHT_BG).stroke('#e5e7eb');
  doc.fillColor(TEXT_LIGHT).fontSize(10).font('Helvetica').text('Total Expense', 325, summaryY + 15);
  doc.fillColor('#ef4444').fontSize(18).font('Helvetica-Bold').text(`Rs. ${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 325, summaryY + 35);

  let currentY = summaryY + 100;

  // Transactions Table Header
  doc.fillColor(TEXT_DARK).fontSize(16).font('Helvetica-Bold').text('Transactions', 50, currentY);
  currentY += 30;
  
  const drawHeaderRow = (y) => {
    doc.rect(50, y - 5, 495, 25).fill(BRAND_COLOR);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('Date', 60, y, { width: 70 });
    doc.text('Description', 130, y, { width: 160 });
    doc.text('Category', 300, y, { width: 90 });
    doc.text('Account', 400, y, { width: 70 });
    doc.text('Amount', 470, y, { width: 65, align: 'right' });
  };

  const drawRow = (y, date, desc, category, account, amount, type, index) => {
    if (index % 2 === 0) {
      doc.rect(50, y - 5, 495, 25).fill(LIGHT_BG);
    }
    
    doc.fillColor(TEXT_DARK).fontSize(9).font('Helvetica');
    doc.text(date, 60, y, { width: 70 });
    doc.text(desc, 130, y, { width: 160 });
    doc.text(category, 300, y, { width: 90 });
    doc.text(account, 400, y, { width: 70 });
    
    if (type === 'INCOME') {
      doc.fillColor('#10b981').font('Helvetica-Bold');
    } else {
      doc.fillColor('#TEXT_DARK').font('Helvetica');
    }
    
    doc.text((type === 'INCOME' ? '+' : '-') + ' Rs. ' + amount, 470, y, { width: 65, align: 'right' });
  };

  drawHeaderRow(currentY);
  currentY += 25;
  
  let rowIndex = 0;
  for (const tx of transactions) {
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;
      drawHeaderRow(currentY);
      currentY += 25;
    }
    
    drawRow(
      currentY, 
      new Date(tx.transactionDate).toLocaleDateString(), 
      tx.description.length > 25 ? tx.description.substring(0, 25) + '...' : tx.description, 
      tx.category?.name || 'Uncategorized', 
      tx.account.name, 
      Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 
      tx.type,
      rowIndex
    );
    currentY += 25;
    rowIndex++;
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

}, { connection: createRedisConnection() });

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
}, { connection: createRedisConnection() });

pdfCleanupWorker.on('failed', (job, err) => {
  console.error(`PDF Cleanup Job ${job.id} failed:`, err.message);
});

module.exports = {
  exportWorker,
  pdfCleanupWorker
};
