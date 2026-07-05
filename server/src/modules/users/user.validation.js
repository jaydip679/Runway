const { z } = require('zod');

const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    // We can add bio or other fields later
  }).strict()
});

module.exports = {
  updateUserSchema
};
