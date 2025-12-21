import { z } from 'zod';

const configSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  APP_VERSION: z.string().default('1.0.0'),
  SERVICE_NAME: z.string().default('api'),

  // Database
  DATABASE_URL: z.string().url(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_TOKEN_TTL: z.string().default('15m'),
  JWT_REFRESH_TOKEN_TTL: z.string().default('7d'),

  // Security
  CORS_ORIGINS: z.string().transform((s) => s.split(',')).default('http://localhost:3000'),

  // Observability
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limiting
  RATE_LIMIT_ENABLED: z
    .string()
    .transform((s) => s === 'true')
    .default('true'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('1000'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('3600000'),

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
