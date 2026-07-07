const { z } = require('zod');

const createTransactionSchema = z.object({
  body: z.object({
    accountId: z.string().uuid(),
    categoryId: z.string().uuid().optional(),
    amount: z.preprocess((val) => Number(val), z.number().positive('Amount must be greater than 0')),
    type: z.enum(['INCOME', 'EXPENSE']),
    description: z.string().min(1).max(255),
    transactionDate: z.string().refine((val) => {
      const date = new Date(val);
      const now = new Date();
      now.setDate(now.getDate() + 1); // 1 day in the future
      return date <= now;
    }, { message: 'TRANSACTION_FUTURE_DATE_NOT_ALLOWED' })
  })
});

const updateTransactionSchema = z.object({
  body: z.object({
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.preprocess((val) => Number(val), z.number().positive()).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    description: z.string().min(1).max(255).optional(),
    transactionDate: z.string().refine((val) => {
      const date = new Date(val);
      const now = new Date();
      now.setDate(now.getDate() + 1);
      return date <= now;
    }, { message: 'TRANSACTION_FUTURE_DATE_NOT_ALLOWED' }).optional()
  })
});

const getTransactionsSchema = z.object({
  query: z.object({
    limit: z.preprocess((val) => Number(val), z.number().min(1).max(100).default(20)),
    cursor: z.string().optional(),
    accountId: z.string().uuid().optional(),
    categoryId: z.string().uuid().optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    search: z.string().optional()
  })
});

module.exports = {
  createTransactionSchema,
  updateTransactionSchema,
  getTransactionsSchema
};
