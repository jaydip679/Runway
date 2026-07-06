const { z } = require('zod');

const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50),
    type: z.enum(['INCOME', 'EXPENSE']),
    icon: z.string().optional(),
  }),
});

const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
    icon: z.string().optional(),
  }).strict(),
});

const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
});

const listCategoriesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('50'),
    type: z.enum(['INCOME', 'EXPENSE']).optional(),
  }),
});

module.exports = {
  createCategorySchema,
  updateCategorySchema,
  deleteCategorySchema,
  listCategoriesSchema,
};
