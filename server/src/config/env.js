require('dotenv').config();
const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(4000),
  CLIENT_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  REFRESH_TOKEN_HASH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_CALLBACK_URL: z.string().url(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  AI_PROVIDER: z.enum(['openai', 'gemini']),
  OPENAI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  AI_DAILY_QUERY_LIMIT: z.coerce.number().default(20),
  EMAIL_PROVIDER: z.enum(['resend', 'gmail', 'mock']).default('gmail'),
  RESEND_API_KEY: z.string().optional(),
  GMAIL_REFRESH_TOKEN: z.string().optional(),
  EMAIL_FROM: z.string().min(1),
  ADMIN_SEED_EMAIL: z.string().email(),
  ADMIN_SEED_PASSWORD: z.string().min(8),
  LOG_LEVEL: z.string().default('info'),
  FORECAST_WINDOW_DAYS: z.coerce.number().default(60),
  LOW_BALANCE_THRESHOLD: z.coerce.number().default(0),
}).refine(
  (data) => data.AI_PROVIDER !== 'openai' || !!data.OPENAI_API_KEY,
  { message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai' }
).refine(
  (data) => data.EMAIL_PROVIDER !== 'resend' || !!data.RESEND_API_KEY,
  { message: 'RESEND_API_KEY is required when EMAIL_PROVIDER=resend' }
).refine(
  (data) => data.EMAIL_PROVIDER !== 'gmail' || (!!data.GOOGLE_CLIENT_ID && !!data.GOOGLE_CLIENT_SECRET && !!data.GMAIL_REFRESH_TOKEN),
  { message: 'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GMAIL_REFRESH_TOKEN are required when EMAIL_PROVIDER=gmail' }
);

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const errorMessages = parsed.error.issues.map(issue => {
    const path = issue.path.join('.');
    return path ? `${path}: ${issue.message}` : issue.message;
  });
  console.error(`\x1b[31m❌ Missing or invalid environment variables:\x1b[0m\n  - ${errorMessages.join('\n  - ')}`);
  process.exit(1);
}

module.exports = parsed.data;
