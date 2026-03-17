/**
 * register-webhooks.ts
 *
 * Standalone ts-node script (no NestJS bootstrap) that:
 * 1. Loads env vars from .env.local then .env
 * 2. Validates required env vars
 * 3. Enforces NODE_ENV vs API_BASE_URL guardrail
 * 4. Queries agent_config and registers Telegram webhooks for all users
 * 5. Performs WhatsApp configuration health check
 * 6. Prints a formatted summary table
 *
 * Usage: pnpm run register-webhooks (from apps/api directory)
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// 1. Env loading — mirrors NestJS ConfigModule order: .env.local first, .env second
// ---------------------------------------------------------------------------
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ---------------------------------------------------------------------------
// 2. Required env validation
// ---------------------------------------------------------------------------
const REQUIRED_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'API_BASE_URL'] as const;

for (const varName of REQUIRED_VARS) {
  if (!process.env[varName]) {
    console.error(`ERROR: Required environment variable "${varName}" is not set.`);
    console.error('Check your .env.local or .env file.');
    process.exit(1);
  }
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_BASE_URL = process.env.API_BASE_URL!;
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// ---------------------------------------------------------------------------
// 3. NODE_ENV vs API_BASE_URL guardrail (HARD BLOCK)
// ---------------------------------------------------------------------------
const LOCAL_PATTERN = /ngrok|localhost|127\.0\.0\.1/;

if (NODE_ENV !== 'production') {
  // development (or unset): API_BASE_URL must be local/tunnel
  if (!LOCAL_PATTERN.test(API_BASE_URL)) {
    console.error('ERROR: NODE_ENV is "development" but API_BASE_URL is a non-local URL.');
    console.error(`  API_BASE_URL: ${API_BASE_URL}`);
    console.error('  This would point your dev bot at production — aborting to protect production data.');
    console.error('  Set API_BASE_URL to a localhost or ngrok URL for development.');
    process.exit(1);
  }
} else {
  // production: API_BASE_URL must NOT be local/tunnel
  if (LOCAL_PATTERN.test(API_BASE_URL)) {
    console.error('ERROR: NODE_ENV is "production" but API_BASE_URL looks like a local/tunnel URL.');
    console.error(`  API_BASE_URL: ${API_BASE_URL}`);
    console.error('  This would point your production bot at a tunnel — aborting to protect production reliability.');
    console.error('  Set API_BASE_URL to your production domain for production deployments.');
    process.exit(1);
  }
}

console.log(`\nEnvironment: ${NODE_ENV}`);
console.log(`API Base URL: ${API_BASE_URL}`);
console.log('NODE_ENV guardrail: PASSED\n');

// ---------------------------------------------------------------------------
// 4. Supabase client
// ---------------------------------------------------------------------------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ---------------------------------------------------------------------------
// Helper: mask token for display
// ---------------------------------------------------------------------------
function maskToken(token: string): string {
  return `***${token.slice(-6)}`;
}

// ---------------------------------------------------------------------------
// Helper: format table row
// ---------------------------------------------------------------------------
function padEnd(str: string, length: number): string {
  return str.length >= length ? str.slice(0, length) : str + ' '.repeat(length - str.length);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AgentConfigRow {
  user_id: string;
  telegram_bot_token: string | null;
  whatsapp_phone_id: string | null;
  whatsapp_verify_token: string | null;
  whatsapp_token: string | null;
}

interface RegistrationResult {
  userId: string;
  maskedToken: string;
  webhookUrl: string;
  status: 'OK' | 'FAILED';
  error?: string;
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------
async function main(): Promise<void> {
  // -------------------------------------------------------------------------
  // 5. Query agent_config for Telegram registrations
  // -------------------------------------------------------------------------
  console.log('Querying agent_config for Telegram bot tokens...');

  const { data: allRows, error: queryError } = await supabase
    .from('agent_config')
    .select('user_id, telegram_bot_token, whatsapp_phone_id, whatsapp_verify_token, whatsapp_token');

  if (queryError) {
    console.error('ERROR: Failed to query agent_config:', queryError.message);
    process.exit(1);
  }

  const rows = (allRows ?? []) as AgentConfigRow[];
  const telegramRows = rows.filter((r) => r.telegram_bot_token != null);

  console.log(`Found ${telegramRows.length} user(s) with Telegram bot tokens.`);

  const results: RegistrationResult[] = [];

  for (const row of telegramRows) {
    const token = row.telegram_bot_token!;
    const webhookUrl = `${API_BASE_URL}/webhooks/telegram/${token}`;

    console.log(`  Registering webhook for user ${row.user_id}...`);

    let status: 'OK' | 'FAILED' = 'FAILED';
    let errorMsg: string | undefined;

    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          allowed_updates: ['message', 'business_connection', 'business_message'],
        }),
      });

      const data = (await res.json()) as { ok: boolean; description?: string };

      if (data.ok === true) {
        status = 'OK';
        console.log(`    OK`);
      } else {
        errorMsg = data.description ?? 'Unknown Telegram API error';
        console.error(`    FAILED: ${errorMsg}`);
      }
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`    FAILED: ${errorMsg}`);
    }

    results.push({
      userId: row.user_id,
      maskedToken: maskToken(token),
      webhookUrl,
      status,
      error: errorMsg,
    });

    // Fail fast on first failure (per user decision)
    if (status === 'FAILED') {
      console.error(`\nFail-fast: Stopping after first registration failure.`);
      printSummaryTable(results);
      printWhatsAppSection(rows);
      process.exit(1);
    }
  }

  // -------------------------------------------------------------------------
  // 6. WhatsApp health check
  // -------------------------------------------------------------------------
  const whatsappRows = rows.filter((r) => r.whatsapp_phone_id != null);

  if (!WHATSAPP_APP_SECRET) {
    console.warn('\nWARNING: WHATSAPP_APP_SECRET is not set. WhatsApp webhook verification will fail.');
  }

  for (const row of whatsappRows) {
    if (!row.whatsapp_verify_token) {
      console.warn(
        `WARNING: User ${row.user_id} has whatsapp_phone_id but no whatsapp_verify_token set in agent_config.`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // 7 & 8. Summary table + WhatsApp section
  // -------------------------------------------------------------------------
  printSummaryTable(results);
  printWhatsAppSection(rows);

  // -------------------------------------------------------------------------
  // 9. Exit code
  // -------------------------------------------------------------------------
  const anyFailed = results.some((r) => r.status === 'FAILED');
  process.exit(anyFailed ? 1 : 0);
}

function printSummaryTable(results: RegistrationResult[]): void {
  const COL_USER = 36;
  const COL_TOKEN = 10;
  const COL_URL = 80;
  const COL_STATUS = 6;

  const separator = '─'.repeat(COL_USER + COL_TOKEN + COL_URL + COL_STATUS + 9);

  console.log('\nWebhook Registration Summary');
  console.log('─'.repeat(28));

  if (results.length === 0) {
    console.log('No Telegram users configured.');
    return;
  }

  const header =
    padEnd('User ID', COL_USER) +
    ' | ' +
    padEnd('Token', COL_TOKEN) +
    ' | ' +
    padEnd('Webhook URL', COL_URL) +
    ' | ' +
    padEnd('Status', COL_STATUS);

  console.log(header);
  console.log(separator);

  for (const r of results) {
    const row =
      padEnd(r.userId, COL_USER) +
      ' | ' +
      padEnd(r.maskedToken, COL_TOKEN) +
      ' | ' +
      padEnd(r.webhookUrl, COL_URL) +
      ' | ' +
      r.status;
    console.log(row);
    if (r.error) {
      console.log(' '.repeat(COL_USER + COL_TOKEN + COL_URL + 9) + `  Error: ${r.error}`);
    }
  }
}

function printWhatsAppSection(rows: AgentConfigRow[]): void {
  const whatsappRows = rows.filter((r) => r.whatsapp_phone_id != null);
  const whatsappWebhookUrl = `${API_BASE_URL}/webhooks/whatsapp`;

  console.log('\nWhatsApp Configuration');
  console.log('─'.repeat(22));
  console.log(`WHATSAPP_APP_SECRET:         ${WHATSAPP_APP_SECRET ? 'set' : 'NOT SET (warning)'}`);
  console.log(`Users with whatsapp_phone_id: ${whatsappRows.length}`);
  console.log(`Expected webhook URL:         ${whatsappWebhookUrl}`);
  console.log('');
  console.log('Note: WhatsApp webhooks cannot be auto-registered.');
  console.log('      Verify the above URL matches your Meta dashboard webhook configuration.');
}

main().catch((err: unknown) => {
  console.error('Unhandled error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
