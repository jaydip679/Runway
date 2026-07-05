const prisma = require('../../config/db');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const path = require('path');
const fs = require('fs');

const getMe = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      authProvider: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, errorCodes.RESOURCE_NOT_FOUND);
  }

  return user;
};

const updateMe = async (userId, data) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      authProvider: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  return user;
};

const uploadAvatar = async (userId, file) => {
  if (!file) {
    throw new AppError('No file uploaded', 400, errorCodes.VALIDATION_ERROR);
  }

  // Get current user to potentially delete old avatar
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  
  if (currentUser && currentUser.avatarUrl) {
    // If it's a local file (starts with /uploads), we can delete it
    if (currentUser.avatarUrl.startsWith('/uploads')) {
      const oldPath = path.join(__dirname, '../../../', currentUser.avatarUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }
  }

  const avatarUrl = `/uploads/avatars/${file.filename}`;
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      role: true,
      authProvider: true,
      isEmailVerified: true,
      createdAt: true
    }
  });

  return user;
};

module.exports = {
  getMe,
  updateMe,
  uploadAvatar
};
