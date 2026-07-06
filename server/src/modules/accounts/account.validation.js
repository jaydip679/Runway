const { z } = require('zod');

const createAccountSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    type: z.enum(['BANK', 'CASH', 'WALLET', 'CREDIT_CARD']),
    currentBalance: z.union([z.string(), z.number()]).transform(val => Number(val)), // Can be negative, no non-negative constraint
    currency: z.string().length(3).optional().default('INR'),
  }),
});

const updateAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid account ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    type: z.enum(['BANK', 'CASH', 'WALLET', 'CREDIT_CARD']).optional(),
    currentBalance: z.union([z.string(), z.number()]).transform(val => Number(val)).optional(),
    currency: z.string().length(3).optional(),
    isActive: z.boolean().optional(),
  }).strict(),
});

const getAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid account ID'),
  }),
});

const deleteAccountSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid account ID'),
  }),
});

const listAccountsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
  }),
});

module.exports = {
  createAccountSchema,
  updateAccountSchema,
  getAccountSchema,
  deleteAccountSchema,
  listAccountsSchema,
};
