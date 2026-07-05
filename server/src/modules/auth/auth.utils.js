const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../../config/env');

const hashPassword = async (plain) => {
  return await bcrypt.hash(plain, 10);
};

const comparePassword = async (plain, hash) => {
  return await bcrypt.compare(plain, hash);
};

const generateAccessToken = (payload) => {
  const { sub, role } = payload;
  return jwt.sign(
    { sub, role },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: '15m',
      jwtid: crypto.randomUUID(),
    }
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(32).toString('base64url');
};

const hashRefreshToken = (raw) => {
  return crypto.createHmac('sha256', env.REFRESH_TOKEN_HASH_SECRET).update(raw).digest('hex');
};

const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateOtp,
};
