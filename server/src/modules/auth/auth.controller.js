const catchAsync = require('../../common/utils/catchAsync');
const authService = require('./auth.service');
const { sendSuccess } = require('../../common/utils/apiResponse');

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];
  
  const data = await authService.register({ email, password, name, ipAddress });
  
  sendSuccess(res, data, undefined, 201);
});

const setTokenCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000 // 15 min
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
  });
};

const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];

  const { user, accessToken, refreshToken } = await authService.verifyOtp({ email, otp, ipAddress });

  setTokenCookies(res, accessToken, refreshToken);
  
  sendSuccess(res, { user }, undefined, 200);
});

const resendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  
  const data = await authService.resendOtp({ email });
  
  sendSuccess(res, data, undefined, 200);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];

  const { user, accessToken, refreshToken } = await authService.login({ email, password, ipAddress });

  setTokenCookies(res, accessToken, refreshToken);
  
  sendSuccess(res, { user }, undefined, 200);
});

const refresh = catchAsync(async (req, res) => {
  const refreshTokenString = req.cookies.refreshToken;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];

  const { accessToken, refreshToken } = await authService.refresh({ refreshTokenString, ipAddress });

  setTokenCookies(res, accessToken, refreshToken);
  
  sendSuccess(res, null, undefined, 200);
});

const logout = catchAsync(async (req, res) => {
  const refreshTokenString = req.cookies.refreshToken;
  
  if (refreshTokenString) {
    await authService.logout({ refreshTokenString });
  }

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  
  res.status(204).send();
});

const googleAuthUrl = catchAsync(async (req, res) => {
  const url = await authService.googleAuthUrl();
  res.redirect(url);
});

const googleCallback = catchAsync(async (req, res) => {
  const { code, state } = req.query;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];

  const { accessToken, refreshToken } = await authService.googleCallback({ code, state, ipAddress });

  setTokenCookies(res, accessToken, refreshToken);
  
  res.redirect(`${process.env.CLIENT_URL}/dashboard`);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const data = await authService.forgotPassword({ email });
  sendSuccess(res, data, undefined, 200);
});

const resetPassword = catchAsync(async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];

  const data = await authService.resetPassword({ email, otp, newPassword, ipAddress });
  
  // Clear any existing session cookies as password reset revokes all sessions
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  sendSuccess(res, data, undefined, 200);
});

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
