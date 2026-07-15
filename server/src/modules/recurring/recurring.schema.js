const { z } = require('zod');
const { startOfDay } = require('date-fns');

const createRecurringSchema = z.object({
  body: z.object({
    accountId: z.string().uuid(),
    name: z.string().min(1).max(100),
    amount: z.preprocess((val) => Number(val), z.number().positive()),
    type: z.enum(['INCOME', 'EXPENSE']),
    intervalUnit: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
    intervalCount: z.number().int().min(1).default(1),
    nextOccurrenceDate: z.string().refine(val => {
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Invalid date format")
  })
});

const updateRecurringSchema = z.object({
  body: z.object({
    accountId: z.string().uuid().optional(),
    name: z.string().min(1).max(100).optional(),
    amount: z.preprocess((val) => val === undefined ? undefined : Number(val), z.number().positive().optional()),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    intervalUnit: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
    intervalCount: z.number().int().min(1).optional(),
    nextOccurrenceDate: z.string().refine(val => {
      if (!val) return true;
      const d = new Date(val);
      return !isNaN(d.getTime());
    }, "Invalid date format").optional()
  }).refine(data => Object.keys(data).length > 0, "At least one field must be provided for update")
});

const confirmDismissSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

module.exports = {
  createRecurringSchema,
  updateRecurringSchema,
  confirmDismissSchema
};
