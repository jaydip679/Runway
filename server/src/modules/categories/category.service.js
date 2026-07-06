const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');

const createCategory = async (userId, data) => {
  try {
    const category = await prisma.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        icon: data.icon,
        isSystem: false,
      },
    });
    return category;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Category already exists', 409, 'CATEGORY_DUPLICATE_NAME');
    }
    throw error;
  }
};

const getCategories = async (userId, page = 1, limit = 50, type) => {
  const skip = (page - 1) * limit;

  const where = {
    OR: [
      { userId },
      { userId: null }, // System categories
    ],
  };

  if (type) {
    where.type = type;
  }

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      skip,
      take: limit,
      orderBy: [
        { isSystem: 'desc' },
        { createdAt: 'desc' },
      ],
    }),
    prisma.category.count({ where }),
  ]);

  return { categories, total, page, limit };
};

const updateCategory = async (userId, categoryId, data) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  if (category.isSystem) {
    throw new AppError('System categories are read-only', 403, 'CATEGORY_SYSTEM_READONLY');
  }

  if (category.userId !== userId) {
    throw new AppError('Category not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  try {
    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
    });
    return updated;
  } catch (error) {
    if (error.code === 'P2002') {
      throw new AppError('Category already exists', 409, 'CATEGORY_DUPLICATE_NAME');
    }
    throw error;
  }
};

const deleteCategory = async (userId, categoryId) => {
  const category = await prisma.category.findFirst({
    where: { id: categoryId },
  });

  if (!category) {
    throw new AppError('Category not found', 404, errorCodes.COMMON.RESOURCE_NOT_FOUND);
  }

  if (category.isSystem) {
    throw new AppError('System categories are read-only', 403, 'CATEGORY_SYSTEM_READONLY');
  }

  if (category.userId !== userId) {
    throw new AppError('Category not found', 404, errorCodes.COMMON.RESOURCE_NOT_FOUND);
  }

  // Check if any transactions reference this category
  const transactionCount = await prisma.transaction.count({
    where: { categoryId, deletedAt: null },
  });

  if (transactionCount > 0) {
    throw new AppError('Category is in use', 409, 'CATEGORY_IN_USE');
  }

  await prisma.category.delete({
    where: { id: categoryId },
  });
};

module.exports = {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory,
};
