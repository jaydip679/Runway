const { z } = require('zod');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('must be a valid email').max(255),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'must contain at least one letter and one digit'),
    name: z.string().min(2).max(100),
  }),
});

const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

const resendOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, 'Password is required')
  })
});

const googleCallbackSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Code is required'),
    state: z.string().min(1, 'State is required')
  })
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address')
  })
});

const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
    newPassword: z.string()
      .min(8, 'Password must be at least 8 characters long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
  })
});

module.exports = {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  googleCallbackSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
