import { ConfigModule } from '@nestjs/config';

export const EnvConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['.env.local', '.env'],
  validate: (config: Record<string, unknown>) => {
    const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`Missing required env var: ${key}`);
      }
    }
    return config;
  },
});

/** Expected env vars:
 * SUPABASE_URL            – Supabase project URL
 * SUPABASE_SERVICE_ROLE_KEY – service-role key (bypasses RLS)
 * ANTHROPIC_API_KEY       – Anthropic API key
 * WHATSAPP_APP_SECRET     – WhatsApp webhook secret
 * PORT                    – HTTP port (default 3001)
 */
