const prisma = require('../../config/db');
const redis = require('../../config/redis');
const AppError = require('../../common/errors/AppError');
const errorCodes = require('../../common/errors/errorCodes');
const { hashPassword, comparePassword } = require('./auth.utils');
const { notificationQueue } = require('../../jobs/queues/notification.queue');
const crypto = require('crypto');

const register = async ({ email, password, name, ipAddress }) => {
  const emailLower = email.toLowerCase();
  
  const existing = await prisma.user.findUnique({
    where: { email: emailLower },
  });
  
  if (existing) {
    throw new AppError('Email already exists', 409, 'AUTH_EMAIL_EXISTS');
  }

  const hashed = await hashPassword(password);
  const otp = crypto.randomInt(100000, 999999).toString();
  
  await redis.set(
    `otp:register:${emailLower}`,
    JSON.stringify({
      email: emailLower,
      passwordHash: hashed,
      name,
      otp,
      attempts: 0
    }),
    'EX',
    300 // 5 minutes
  );

  await notificationQueue.add('email_otp', {
    userId: emailLower,
    type: 'email_otp',
    metadata: {
      otp,
      expiresInMinutes: 5,
      name,
      email: emailLower,
    }
  });

  return { email: emailLower, message: `OTP sent to ${emailLower}. Verify your email to activate your account.` };
};

const { generateAccessToken, generateRefreshToken, hashRefreshToken, generateOtp } = require('./auth.utils');

const verifyOtp = async ({ email, otp, ipAddress }) => {
  const emailLower = email.toLowerCase();
  const key = `otp:register:${emailLower}`;
  const raw = await redis.get(key);
  
  if (!raw) throw new AppError('OTP expired or not found. Please register again.', 400, errorCodes.AUTH_OTP_EXPIRED);
  
  const data = JSON.parse(raw);
  
  if (data.otp !== otp) {
    data.attempts += 1;
    if (data.attempts > 3) {
      await redis.del(key);
      throw new AppError('Too many failed attempts. Please register again.', 429, errorCodes.AUTH_OTP_MAX_ATTEMPTS);
    }
    const ttl = await redis.ttl(key);
    if (ttl > 0) await redis.set(key, JSON.stringify(data), 'EX', ttl);
    throw new AppError('Invalid OTP', 400, errorCodes.AUTH_OTP_INVALID);
  }

  await redis.del(key);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        name: data.name,
        role: 'USER',
        authProvider: 'LOCAL',
        isEmailVerified: true,
        isActive: true,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: newUser.id,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: newUser.id,
        metadata: { email: newUser.email, name: newUser.name, ipAddress },
        ipAddress,
      },
    });
    
    return newUser;
  });

  const accessToken = generateAccessToken({ sub: user.id, role: 'USER' });
  const refreshToken = generateRefreshToken();
  const hashedRefresh = hashRefreshToken(refreshToken);
  const familyId = crypto.randomUUID();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashedRefresh,
      familyId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdByIp: ipAddress,
    },
  });

  return {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    accessToken,
    refreshToken,
  };
};

const resendOtp = async ({ email }) => {
  const emailLower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: emailLower } });
  if (existing) throw new AppError('Email already verified', 409, errorCodes.AUTH_ALREADY_VERIFIED);

  const registerKey = `otp:register:${emailLower}`;
  const cooldownKey = `otp:cooldown:${emailLower}`;

  const inCooldown = await redis.get(cooldownKey);
  if (inCooldown) throw new AppError('Please wait 60 seconds before requesting a new OTP', 429, errorCodes.AUTH_OTP_RATE_LIMITED);

  const raw = await redis.get(registerKey);
  if (!raw) throw new AppError('Registration session expired. Please register again.', 404, errorCodes.RESOURCE_NOT_FOUND);

  const data = JSON.parse(raw);
  const otp = generateOtp();
  
  data.otp = otp;
  data.attempts = 0;

  await redis.set(registerKey, JSON.stringify(data), 'EX', 300); // 5 min TTL
  await redis.set(cooldownKey, '1', 'EX', 60);

  await notificationQueue.add('email_otp', {
    userId: emailLower,
    type: 'email_otp',
    metadata: { otp, name: data.name, email: emailLower }
  });

  return { message: 'A new OTP has been sent.' };
};

const login = async ({ email, password, ipAddress }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() }
  });

  if (!user || (user.authProvider === 'GOOGLE' && !user.passwordHash)) {
    throw new AppError('Invalid credentials', 401, errorCodes.AUTH_INVALID_CREDENTIALS);
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401, errorCodes.AUTH_INVALID_CREDENTIALS);
  }

  if (!user.isEmailVerified) {
    throw new AppError('Email not verified', 403, errorCodes.AUTH_EMAIL_NOT_VERIFIED);
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, errorCodes.AUTH_ACCOUNT_DEACTIVATED);
  }

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt,
        createdByIp: ipAddress
      }
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: { ipAddress },
        ipAddress
      }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
  ]);

  const { passwordHash, ...publicUser } = user;

  return { user: publicUser, accessToken, refreshToken };
};

const refresh = async ({ refreshTokenString, ipAddress }) => {
  if (!refreshTokenString) {
    throw new AppError('Refresh token required', 401, errorCodes.AUTH_REFRESH_TOKEN_INVALID);
  }

  const tokenHash = hashRefreshToken(refreshTokenString);

  const existingToken = await prisma.refreshToken.findFirst({
    where: { tokenHash },
    include: { user: true }
  });

  if (!existingToken) {
    throw new AppError('Invalid refresh token', 401, errorCodes.AUTH_REFRESH_TOKEN_INVALID);
  }

  if (existingToken.revokedAt) {
    await prisma.$transaction([
      prisma.refreshToken.updateMany({
        where: { familyId: existingToken.familyId },
        data: { revokedAt: new Date() }
      }),
      prisma.auditLog.create({
        data: {
          userId: existingToken.userId,
          action: 'REFRESH_TOKEN_REUSE_DETECTED',
          entityType: 'REFRESH_TOKEN',
          entityId: existingToken.id,
          metadata: { severity: 'HIGH', ipAddress, familyId: existingToken.familyId },
          ipAddress
        }
      })
    ]);
    throw new AppError('Token reuse detected', 401, errorCodes.AUTH_REFRESH_TOKEN_REUSED);
  }

  if (existingToken.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401, errorCodes.AUTH_REFRESH_TOKEN_INVALID);
  }
  
  if (!existingToken.user.isActive) {
    throw new AppError('Account is deactivated', 403, errorCodes.AUTH_ACCOUNT_DEACTIVATED);
  }

  const newRefreshTokenString = generateRefreshToken();
  const newTokenHash = hashRefreshToken(newRefreshTokenString);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const newAccessToken = generateAccessToken({ sub: existingToken.user.id, role: existingToken.user.role });

  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() }
    }),
    prisma.refreshToken.create({
      data: {
        userId: existingToken.userId,
        tokenHash: newTokenHash,
        familyId: existingToken.familyId,
        expiresAt,
        createdByIp: ipAddress
      }
    })
  ]);

  return { accessToken: newAccessToken, refreshToken: newRefreshTokenString };
};

const logout = async ({ refreshTokenString }) => {
  if (!refreshTokenString) return;

  const tokenHash = hashRefreshToken(refreshTokenString);
  const existingToken = await prisma.refreshToken.findFirst({
    where: { tokenHash }
  });

  if (existingToken && !existingToken.revokedAt) {
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() }
    });
  }
};

const googleAuthUrl = async () => {
  const state = crypto.randomBytes(16).toString('hex');
  await redis.set(`oauth:state:${state}`, '1', 'EX', 300); // 5 min TTL

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const googleCallback = async ({ code, state, ipAddress }) => {
  const stateKey = `oauth:state:${state}`;
  const validState = await redis.get(stateKey);
  await redis.del(stateKey);

  if (!validState) {
    throw new AppError('Invalid or expired state parameter', 400, errorCodes.AUTH_OAUTH_STATE_INVALID);
  }

  let tokenData;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_CALLBACK_URL
      })
    });
    tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Token exchange failed');
  } catch (error) {
    throw new AppError('Failed to authenticate with Google', 502, errorCodes.AUTH_GOOGLE_TOKEN_INVALID);
  }

  let profileData;
  try {
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    profileData = await profileRes.json();
    if (!profileRes.ok) throw new Error(profileData.error?.message || 'Profile fetch failed');
  } catch (error) {
    throw new AppError('Failed to fetch Google profile', 502, errorCodes.AUTH_GOOGLE_TOKEN_INVALID);
  }

  const { email, name, id: googleId } = profileData;
  const emailLower = email.toLowerCase();

  let user = await prisma.user.findUnique({ where: { googleId } });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: emailLower } });
    if (user && user.authProvider === 'LOCAL') {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId,
          isEmailVerified: true
        }
      });
    } else if (!user) {
      user = await prisma.user.create({
        data: {
          email: emailLower,
          name,
          googleId,
          role: 'USER',
          authProvider: 'GOOGLE',
          isEmailVerified: true,
          isActive: true
        }
      });
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_REGISTERED',
          entityType: 'User',
          entityId: user.id,
          metadata: { provider: 'GOOGLE', email: user.email },
          ipAddress
        }
      });
    }
  }

  if (!user.isActive) {
    throw new AppError('Account is deactivated', 403, errorCodes.AUTH_ACCOUNT_DEACTIVATED);
  }

  const familyId = crypto.randomUUID();
  const accessToken = generateAccessToken({ sub: user.id, role: user.role });
  const refreshToken = generateRefreshToken();
  const tokenHash = hashRefreshToken(refreshToken);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.$transaction([
    prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        familyId,
        expiresAt,
        createdByIp: ipAddress
      }
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'USER',
        entityId: user.id,
        metadata: { provider: 'GOOGLE', ipAddress },
        ipAddress
      }
    }),
    prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })
  ]);

  return { accessToken, refreshToken };
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.authProvider !== 'LOCAL' || !user.isActive) {
    return { message: 'If that email is registered, a password reset code has been sent.' };
  }

  const key = `password_reset:${user.id}`;
  const inCooldown = await redis.get(`password_reset:cooldown:${user.id}`);
  if (inCooldown) throw new AppError('Please wait 60 seconds before requesting again', 429, errorCodes.AUTH_OTP_RATE_LIMITED);

  const otp = generateOtp();
  await redis.set(key, JSON.stringify({ otp, attempts: 0 }), 'EX', 900); // 15 min TTL
  await redis.set(`password_reset:cooldown:${user.id}`, '1', 'EX', 60);

  await notificationQueue.add('password_reset', {
    userId: user.id,
    type: 'password_reset',
    metadata: { otp, name: user.name, email: user.email }
  });

  return { message: 'If that email is registered, a password reset code has been sent.' };
};

const resetPassword = async ({ email, otp, newPassword, ipAddress }) => {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user || user.authProvider !== 'LOCAL' || !user.isActive) {
    throw new AppError('Invalid request', 400, errorCodes.AUTH_INVALID_CREDENTIALS);
  }

  const key = `password_reset:${user.id}`;
  const raw = await redis.get(key);
  if (!raw) throw new AppError('OTP expired or not found', 400, errorCodes.AUTH_OTP_EXPIRED);

  const data = JSON.parse(raw);
  if (data.otp !== otp) {
    data.attempts += 1;
    if (data.attempts > 3) {
      await redis.del(key);
      throw new AppError('Too many failed attempts. Please request a new OTP.', 429, errorCodes.AUTH_OTP_MAX_ATTEMPTS);
    }
    const ttl = await redis.ttl(key);
    if (ttl > 0) await redis.set(key, JSON.stringify(data), 'EX', ttl);
    throw new AppError('Invalid OTP', 400, errorCodes.AUTH_OTP_INVALID);
  }

  const hashed = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashed }
    }),
    prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_RESET',
        entityType: 'USER',
        entityId: user.id,
        metadata: { ipAddress },
        ipAddress
      }
    })
  ]);

  await redis.del(key);

  return { message: 'Password has been successfully reset.' };
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  googleAuthUrl,
  googleCallback,
  forgotPassword,
  resetPassword,
};
