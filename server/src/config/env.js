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
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number(),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
  ADMIN_SEED_EMAIL: z.string().email(),
  ADMIN_SEED_PASSWORD: z.string().min(8),
  LOG_LEVEL: z.string().default('info'),
  FORECAST_WINDOW_DAYS: z.coerce.number().default(60),
  LOW_BALANCE_THRESHOLD: z.coerce.number().default(0),
}).refine(
  (data) => data.AI_PROVIDER !== 'openai' || !!data.OPENAI_API_KEY,
  { message: 'OPENAI_API_KEY is required when AI_PROVIDER=openai' }
);

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const errorPaths = parsed.error.issues.map(issue => issue.path.join('.'));
  console.error(`\x1b[31m❌ Missing or invalid environment variables:\x1b[0m ${errorPaths.join(', ')}`);
  process.exit(1);
}

module.exports = parsed.data;
