const { z } = require('zod');

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100).optional(),
  })
});

module.exports = {
  updateUserSchema
};
