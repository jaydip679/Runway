const { Queue, Worker } = require('bullmq');
const redis = require('../../config/redis');
const prisma = require('../../config/db');
const fs = require('fs');
const readline = require('readline');
const { z } = require('zod');

const csvImportQueue = new Queue('csvImportQueue', { connection: redis });

const rowSchema = z.object({
  date: z.string(),
  description: z.string().min(1),
  amount: z.preprocess((val) => Number(val), z.number().positive()),
  type: z.enum(['INCOME', 'EXPENSE']),
  categoryId: z.string().uuid().optional().nullable()
});

const processCsvImport = async (job) => {
  const { jobId, filePath, accountId, userId } = job.data;
  
  await prisma.csvImportJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING' }
  });

  const errorLog = [];
  let successRows = 0;
  let failedRows = 0;

  try {
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let isHeader = true;
    let headers = [];
    let rowNumber = 0;
    const batch = [];

    for await (const line of rl) {
      rowNumber++;
      if (isHeader) {
        headers = line.split(',').map(h => h.trim().toLowerCase());
        isHeader = false;
        continue;
      }

      if (!line.trim()) continue;

      const values = line.split(',').map(v => v.trim());
      const rawRow = {};
      headers.forEach((h, i) => { rawRow[h] = values[i]; });

      try {
        const parsed = rowSchema.parse(rawRow);
        
        batch.push({
          userId,
          accountId,
          categoryId: parsed.categoryId || null,
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          transactionDate: new Date(parsed.date),
          source: 'CSV_IMPORT'
        });

        if (batch.length === 500) {
          await prisma.$transaction(async (tx) => {
            await tx.transaction.createMany({ data: batch });
          });
          successRows += batch.length;
          batch.length = 0; // clear batch
        }
      } catch (err) {
        failedRows++;
        errorLog.push({ rowNumber, reason: err.errors ? err.errors[0].message : err.message });
      }
    }

    // Insert remaining
    if (batch.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.transaction.createMany({ data: batch });
      });
      successRows += batch.length;
    }

    await prisma.csvImportJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        successRows,
        failedRows,
        errorLog: errorLog.length > 0 ? errorLog : null
      }
    });

  } catch (error) {
    await prisma.csvImportJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        errorLog: [{ rowNumber: 0, reason: error.message }]
      }
    });
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath); // Cleanup file
    }
  }
};

const csvImportWorker = new Worker('csvImportQueue', processCsvImport, { connection: redis });

csvImportWorker.on('failed', (job, err) => {
  console.error(`[csvImportWorker] Job ${job.id} failed:`, err);
});

module.exports = {
  csvImportQueue,
  csvImportWorker
};
