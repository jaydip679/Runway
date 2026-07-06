const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. System Categories
  const systemCategories = [
    { name: 'Rent', type: 'EXPENSE', icon: 'home' },
    { name: 'Groceries', type: 'EXPENSE', icon: 'shopping-cart' },
    { name: 'Subscriptions', type: 'EXPENSE', icon: 'repeat' },
    { name: 'Transport', type: 'EXPENSE', icon: 'truck' },
    { name: 'Utilities', type: 'EXPENSE', icon: 'zap' },
    { name: 'Other', type: 'EXPENSE', icon: 'more-horizontal' },
    { name: 'Salary', type: 'INCOME', icon: 'dollar-sign' },
  ];

  for (const cat of systemCategories) {
    // Check if category exists
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        name: cat.name,
        type: cat.type,
      },
    });

    if (existing) {
      // Update
      await prisma.category.update({
        where: { id: existing.id },
        data: { icon: cat.icon, isSystem: true },
      });
      console.log(`Updated system category: ${cat.name}`);
    } else {
      // Create
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          isSystem: true,
          userId: null,
        },
      });
      console.log(`Created system category: ${cat.name}`);
    }
  }

  await seedAdmin();
  console.log('✅ Seed completed successfully.');
}

async function seedAdmin() {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;
  
  if (!email || !password) {
    console.log('⚠️ Skipping admin seed: ADMIN_SEED_EMAIL or ADMIN_SEED_PASSWORD not provided.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  
  if (!existing) {
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);
    
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: 'System Admin',
        role: 'ADMIN',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log(`Created admin account: ${email}`);
  } else {
    // Optionally update admin password here, or do nothing.
    console.log(`Admin account already exists: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
