const { PrismaClient } = require('@prisma/client');
const logger = require('../config/logger');

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Income', type: 'INCOME', isSystem: true, color: '#10b981' },
  { name: 'Rent & Utilities', type: 'EXPENSE', isSystem: true, color: '#ef4444' },
  { name: 'Groceries', type: 'EXPENSE', isSystem: true, color: '#f59e0b' },
  { name: 'Transportation', type: 'EXPENSE', isSystem: true, color: '#3b82f6' },
  { name: 'Entertainment', type: 'EXPENSE', isSystem: true, color: '#8b5cf6' },
  { name: 'Shopping', type: 'EXPENSE', isSystem: true, color: '#ec4899' },
  { name: 'Dining Out', type: 'EXPENSE', isSystem: true, color: '#f97316' },
  { name: 'Transfer', type: 'TRANSFER', isSystem: true, color: '#64748b' },
];

const seedCategories = async () => {
  try {
    logger.info('Starting system category seed...');
    for (const cat of defaultCategories) {
      await prisma.category.upsert({
        where: { name: cat.name },
        update: {},
        create: {
          name: cat.name,
          type: cat.type,
          isSystem: cat.isSystem,
          color: cat.color,
          // System categories belong to no specific user initially, but we allow them to be global
          // Wait, our schema might require userId for all categories.
          // Let's check the schema.
        },
      });
    }
    logger.info('Categories seeded successfully.');
  } catch (error) {
    logger.error('Error seeding categories:', error);
  } finally {
    await prisma.$disconnect();
  }
};

seedCategories();
