const {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} = require('../auth.utils');
const jwt = require('jsonwebtoken');
const env = require('../../../config/env');

describe('Auth Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password and successfully compare it', async () => {
      const plain = 'supersecurepassword123';
      const hash = await hashPassword(plain);
      
      expect(hash).not.toBe(plain);
      
      const isMatch = await comparePassword(plain, hash);
      expect(isMatch).toBe(true);
      
      const isWrongMatch = await comparePassword('wrongpassword', hash);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Tokens', () => {
    it('should generate an access token with correct payload and expiration', () => {
      const payload = { sub: 'user-123', role: 'USER' };
      const token = generateAccessToken(payload);
      
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
      expect(decoded.sub).toBe('user-123');
      expect(decoded.role).toBe('USER');
      expect(decoded.jti).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(15 * 60); // 15 minutes
    });

    it('should generate a base64url refresh token', () => {
      const token = generateRefreshToken();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token).toMatch(/^[A-Za-z0-9\-_]+$/); // base64url charset
    });

    it('should hash a refresh token consistently', () => {
      const token = 'sample-refresh-token';
      const hash1 = hashRefreshToken(token);
      const hash2 = hashRefreshToken(token);
      
      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // sha256 hex is 64 chars
    });
  });
});
