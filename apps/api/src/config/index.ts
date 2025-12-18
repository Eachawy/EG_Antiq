import { z } from 'zod';

const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_VERSION: z.string().default('1.0.0'),
  SERVICE_NAME: z.string().default('api'),

  // Database
  DATABASE_URL: z.string().url(),
  DATABASE_READ_REPLICA_URL: z.string().url().optional(),

  // Redis
  REDIS_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Security
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  CORS_ORIGINS: z.string().transform((s) => s.split(',')),

  // External Services
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  SES_FROM_EMAIL: z.string().email().optional(),

  // Observability
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  JAEGER_ENDPOINT: z.string().url().optional(),
  SENTRY_DSN: z.string().url().optional(),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z
    .string()
    .transform((s) => s === 'true')
    .default('true'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('1000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('3600000'),
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
