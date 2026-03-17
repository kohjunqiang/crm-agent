# Telegram Channel Setup

This runbook walks you through configuring the Telegram messaging channel for the Agent CRM. The setup uses a **two-bot model**: a dev bot for local development and a prod bot for production. Both bots run against the same codebase — only the token (and therefore the webhook URL) differs between environments.

## Overview

Each environment gets its own bot token registered in the `agent_config` table. The webhook registration script reads `API_BASE_URL` from the environment and registers Telegram webhooks pointing to that URL. A NODE_ENV guardrail prevents accidentally pointing a production bot at an ngrok tunnel or a dev bot at a Railway URL.

```
Local dev:    Dev Bot Token  →  ngrok HTTPS URL  →  localhost API
Production:   Prod Bot Token →  Railway URL      →  Railway API
```

## Prerequisites

- Telegram account (any device)
- Access to [BotFather](https://t.me/BotFather) in Telegram
- ngrok installed and running (for local webhook delivery)
- Railway API deployed and reachable (for production webhooks)

## Creating a Telegram Bot via BotFather

You'll create **two bots**: one for development, one for production. Follow these steps for each.

1. Open Telegram and search for **@BotFather** or go to https://t.me/BotFather
2. Start a chat and send `/newbot`
3. BotFather asks: **"What's the name of your bot?"**
   - Dev bot: `My CRM Dev Bot` (or any descriptive name)
   - Prod bot: `My CRM Bot` (the name users will see)
4. BotFather asks: **"What username would you like to give it?"**
   - Must end in `bot` (e.g., `mycrm_dev_bot`, `mycrm_prod_bot`)
   - Must be globally unique — try a few variations if your first choice is taken
5. BotFather replies with a success message containing the **bot token**:
   ```
   Done! Congratulations on your new bot. You will find it at t.me/mycrm_dev_bot.
   Use this token to access the HTTP API:
   1234567890:AAHdqTcvCH1vGWJxfSeofSh0riPsuQUber8
   ```
6. **Copy and save the token** — you'll need it in the next section.
7. Repeat steps 2–6 to create the second bot (dev or prod, whichever you haven't done yet).

> **Tip:** Run `/mybots` in BotFather at any time to see your existing bots and retrieve their tokens.

## Environment Configuration

Telegram bot tokens are **not stored in environment variables**. Each user's bot token is stored per-user in the `agent_config` table in the database. This supports multi-tenant deployments where different users can have different bots.

### How to configure the bot token

1. Start the local API (`cd apps/api && pnpm run start:dev`)
2. Open the web dashboard at http://localhost:3000
3. Navigate to **Settings > Agent Configuration**
4. Paste the bot token into the **Telegram Bot Token** field and save

The token is now stored in `agent_config.telegram_bot_token` for your user. The environment's `API_BASE_URL` determines which webhook URL gets registered.

### Required environment variables

**Local development** — add to `apps/api/.env.local`:

```bash
API_BASE_URL=https://abc123.ngrok.io   # Your current ngrok HTTPS URL (no trailing slash)
NODE_ENV=development
```

**Production** — add to Railway environment variables:

```bash
API_BASE_URL=https://your-api.railway.app   # Your Railway public domain
NODE_ENV=production
```

> **Important:** `API_BASE_URL` must be the HTTPS URL with no trailing slash. The webhook registration script appends `/webhooks/telegram/<botToken>` to this URL.

## Registering Webhooks

After saving the bot token in the dashboard and setting `API_BASE_URL`, register the webhook:

```bash
cd apps/api
pnpm run register-webhooks
```

The script:
1. Reads all users from `agent_config` where `telegram_bot_token` is set
2. Constructs the webhook URL: `${API_BASE_URL}/webhooks/telegram/${botToken}`
3. Calls the Telegram API to register the webhook for each user
4. Prints a summary table showing registration status

**Expected output:**
```
Registering Telegram webhooks...

  User ID                   | Token (masked)    | Webhook URL                              | Status
  --------------------------|-------------------|------------------------------------------|-------
  user_2abc123              | 1234...ber8        | https://abc123.ngrok.io/webhooks/...     | OK

Telegram: 1/1 registered successfully.

WhatsApp health check...
  WHATSAPP_APP_SECRET: set
  Users with whatsapp_phone_id: 1
  Expected webhook URL: https://abc123.ngrok.io/webhooks/whatsapp
  Configure this URL in the Meta developer dashboard.
```

### NODE_ENV guardrail

The script enforces strict URL validation based on `NODE_ENV`:

| Environment     | Allowed URL patterns           | Rejected URL patterns         |
|-----------------|-------------------------------|-------------------------------|
| `development`   | `ngrok.io`, `localhost`        | `railway.app`, non-ngrok HTTPS |
| `production`    | Any non-ngrok HTTPS URL        | `ngrok.io`, `localhost`        |

If the URL doesn't match the environment, the script exits with an error:

```
Error: NODE_ENV=development but API_BASE_URL (https://your-api.railway.app)
looks like a production URL. Check your .env.local.
```

This prevents accidentally pointing your production bot at a local ngrok tunnel (or vice versa).

## Dev vs Prod Workflow

```
┌─────────────────────────────────────────────────────────┐
│                  Local Development                       │
│                                                         │
│  .env.local                 agent_config (local DB)     │
│  API_BASE_URL=ngrok URL  →  telegram_bot_token = DEV    │
│  NODE_ENV=development       token                       │
│                                                         │
│  pnpm run register-webhooks                             │
│  → registers DEV bot → ngrok URL → localhost API        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Production (Railway)                   │
│                                                         │
│  Railway env vars           agent_config (prod DB)      │
│  API_BASE_URL=Railway URL → telegram_bot_token = PROD   │
│  NODE_ENV=production        token                       │
│                                                         │
│  pnpm run register-webhooks (run after deploy)          │
│  → registers PROD bot → Railway URL → Railway API       │
└─────────────────────────────────────────────────────────┘
```

**Key points:**
- Same codebase runs in both environments — only the token and `API_BASE_URL` differ
- The bot token in `agent_config` determines which Telegram bot receives messages
- You must re-run `pnpm run register-webhooks` whenever the webhook URL changes (e.g., after every ngrok restart on the free tier)
- Production webhook registration can be done from a local terminal pointed at Railway:
  ```bash
  cd apps/api
  API_BASE_URL=https://your-api.railway.app NODE_ENV=production pnpm run register-webhooks
  ```

## Telegram Business Features

The webhook registration script sets `allowed_updates` to include:
- `message` — standard messages
- `business_connection` — user connects their Telegram Business account to the bot
- `business_message` — messages sent through the connected Telegram Business account

When a user connects their Telegram Business account, incoming business messages are routed through the same `/webhooks/telegram/:botToken` endpoint. The CRM processes these the same way as regular messages, attributing them to the correct contact via Telegram user ID.

To test business messages in development, a Telegram Premium subscription is required to enable Telegram Business features on an account.

## Troubleshooting

### 1. Messages not arriving after ngrok restart

ngrok free tier generates a new HTTPS URL on every restart. The old webhook URL is now broken.

**Fix:** Get the new ngrok URL, update `API_BASE_URL` in `.env.local`, then re-run:
```bash
cd apps/api && pnpm run register-webhooks
```

### 2. setWebhook returns SSL error

Telegram requires the webhook URL to use HTTPS with a valid certificate. ngrok provides this automatically.

**Fix:** Confirm you're using the `https://` ngrok URL, not `http://`. The script will include the URL in its output — verify it starts with `https://`.

### 3. Bot token visible in access logs

The webhook URL pattern is `/webhooks/telegram/:botToken`, which means the bot token appears in API access logs. This is a known v1 limitation.

**Workaround (future):** Use Telegram's `secret_token` header for verification instead of embedding the token in the URL path. This is deferred to a future milestone.

### 4. Script refuses to register — environment mismatch

```
Error: NODE_ENV=development but API_BASE_URL looks like a production URL.
```

**Fix:** Check `apps/api/.env.local` — `API_BASE_URL` must be your current ngrok URL (for development) or your Railway URL (for production). Ensure `NODE_ENV` is set correctly.

### 5. Webhook registered but no business messages arrive

Business messages require `business_message` in the `allowed_updates` array. The registration script includes this automatically, but if you registered webhooks manually or with an older version:

**Fix:** Re-run `pnpm run register-webhooks` to update the `allowed_updates` list. Verify with:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```
Check that `allowed_updates` in the response includes `business_message`.
