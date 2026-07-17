const { z } = require('zod');

const createBudgetSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z.number().positive('Budget amount must be positive'),
    period: z.enum(['MONTHLY', 'YEARLY']).optional().default('MONTHLY'),
  })
});

const updateBudgetSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid budget ID'),
  }),
  body: z.object({
    amount: z.number().positive('Budget amount must be positive').optional(),
    period: z.enum(['MONTHLY', 'YEARLY']).optional(),
  })
});

module.exports = {
  createBudgetSchema,
  updateBudgetSchema,
};
