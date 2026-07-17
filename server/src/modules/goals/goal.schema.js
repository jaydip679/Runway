const { z } = require('zod');

const createGoalSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Goal name is required'),
    targetAmount: z.number().positive('Target amount must be positive'),
    targetDate: z.string().datetime().or(z.date()),
    currentAmount: z.number().nonnegative().optional().default(0),
    linkedAccountIds: z.array(z.string().uuid()).optional(),
  })
});

const updateGoalSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid goal ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Goal name is required').optional(),
    targetAmount: z.number().positive('Target amount must be positive').optional(),
    targetDate: z.string().datetime().or(z.date()).optional(),
    currentAmount: z.number().nonnegative().optional(),
    linkedAccountIds: z.array(z.string().uuid()).optional(),
  })
});

module.exports = {
  createGoalSchema,
  updateGoalSchema,
};
