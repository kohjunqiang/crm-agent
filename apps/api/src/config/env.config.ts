import { ConfigModule } from '@nestjs/config';
import { z } from 'zod';

const envSchema = z.object({
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().optional().transform((v) => v || undefined),
  PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  API_BASE_URL: z.string().optional(),
  WHATSAPP_APP_SECRET: z.string().optional(),
});

export type EnvConfig = z.infer<typeof envSchema>;

export const EnvConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  validate: (config) => {
    const result = envSchema.safeParse(config);
    if (!result.success) {
      const missing = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('\n  ');
      throw new Error(
        `Environment validation failed:\n  ${missing}\n\nCheck your .env.local file.`,
      );
    }
    return result.data as Record<string, any>;
  },
});
