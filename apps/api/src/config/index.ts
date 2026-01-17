import { z } from 'zod';
import { config as loadDotenv } from 'dotenv';
import { join } from 'path';

// Load .env file from monorepo root
// process.cwd() is /Volumes/Data/Ancient/Antiq/EG_Antiq/apps/api
// Need to go up 2 levels to reach monorepo root
loadDotenv({ path: join(process.cwd(), '../../.env') });

const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_URL: z.string().url().default('http://localhost:3000'), // Required for OAuth callbacks

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Portal JWT
  PORTAL_JWT_SECRET: z.string().min(32),
  PORTAL_JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  PORTAL_JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),

  // OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_APP_ID: z.string().optional(),
  FACEBOOK_APP_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY_PATH: z.string().optional(),

  // Security
  CORS_ORIGINS: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),

  // Observability
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Email
  EMAIL_HOST: z.string().default('smtp.gmail.com'),
  EMAIL_PORT: z.string().transform(Number).default('587'),
  EMAIL_SECURE: z
    .string()
    .transform((s) => s === 'true')
    .default('false'),
  EMAIL_USER: z.string().default('noreply@example.com'),
  EMAIL_PASSWORD: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@example.com'),
  EMAIL_FROM_NAME: z.string().default('EG Antiq'),
  ADMIN_EMAIL: z.string().email().default('admin@example.com'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
});

export type Config = z.infer<typeof configSchema>;

export function loadConfig(): Config {
  try {
    const parsed = configSchema.parse(process.env);
    return parsed;
  } catch (error) {
    console.error('Configuration validation failed:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }
}

export const config = loadConfig();
