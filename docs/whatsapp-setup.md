# WhatsApp Channel Setup

This runbook walks you through configuring the WhatsApp messaging channel using the WhatsApp Cloud API. Development uses a Meta-provided test phone number (limited to 5 pre-approved recipients). Production requires Meta Business verification and a dedicated phone number (see [Path to Production](#path-to-production)).

## Overview

WhatsApp Cloud API is managed via Meta's developer platform. Unlike Telegram, webhook registration is manual — you configure the callback URL in the Meta dashboard. The CRM handles the webhook verification challenge automatically once credentials are set.

```
Meta Platform                    Agent CRM
─────────────                    ─────────
App Secret  ─────────────────→   WHATSAPP_APP_SECRET (env var)
Phone Number ID  ────────────→   agent_config.whatsapp_phone_id
Access Token  ───────────────→   agent_config.whatsapp_token
Verify Token (you choose)  ──→   agent_config.whatsapp_verify_token
                                     ↑ must be set BEFORE configuring
                                       the webhook in Meta dashboard
```

## Prerequisites

- Facebook account
- A Meta Business account (you'll create one during Step 1 if needed)
- ngrok running and pointing to your local API (`https://abc123.ngrok.io`)

## Step 1: Create a Meta Business Account

1. Go to https://business.facebook.com/
2. If you don't have a Meta Business account, click **"Create Account"** and follow the prompts
   - Enter a business name, your name, and your work email
   - Complete email verification if prompted
3. Note your **Business ID** — visible in the URL: `business.facebook.com/settings/?business=123456789`

> **Already have a Meta Business account?** Skip to Step 2.

## Step 2: Create a WhatsApp Cloud API App

1. Go to https://developers.facebook.com/
2. Click **"My Apps"** in the top right, then **"Create App"**
3. Select **"Business"** as the app type and click **Next**
4. Enter an app name (e.g., `My CRM Dev`) and select your Meta Business account
5. Click **"Create App"** (you may be prompted to re-enter your Facebook password)
6. In the **Add Products** section of your new app, find **WhatsApp** and click **"Set up"**
7. Select your Meta Business account when prompted and click **Continue**

You're now in the WhatsApp product dashboard. The left sidebar shows **WhatsApp > API Setup** and **WhatsApp > Configuration**.

## Step 3: Configure a Test Phone Number

Meta automatically provides a test phone number for development.

1. Go to **WhatsApp > API Setup** in the left sidebar
2. Under **"From"**, your test phone number is displayed (e.g., `+1 555-555-5555`)
3. Under **"To"**, add up to 5 recipient phone numbers that can receive messages from the test number
   - Click **"Add phone number"**
   - Enter the number with country code (e.g., `+1 555 123 4567`)
   - Meta sends a verification code to that number — enter it to confirm
   - Repeat for each test recipient

> **Critical limitation:** The test phone number can only send messages to up to **5 pre-approved recipient numbers**. Messages to any other number are silently dropped. This is a Meta restriction on test numbers and cannot be bypassed during development. Add all developer phones in this step.

## Step 4: Get Your Credentials

You'll need four pieces of information. Collect them now before configuring anything in the CRM.

### App Secret

1. In the Meta developer dashboard, go to **Settings > Basic** (left sidebar)
2. Find **"App Secret"** — click **"Show"** and re-enter your Facebook password if prompted
3. Copy the value — this is your `WHATSAPP_APP_SECRET`

**Example format:** `a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4`

### Phone Number ID

1. Go to **WhatsApp > API Setup**
2. Under **"From"**, find the **"Phone number ID"** — this is a long numeric string like `107853859263817`
3. Copy this value — this is your `whatsapp_phone_id`

> **Common mistake:** Do NOT use the formatted display phone number (e.g., `+1 555-555-5555`). The CRM requires the numeric Phone number ID from the API Setup page.

### Temporary Access Token

1. Go to **WhatsApp > API Setup**
2. Under the phone number, click **"Generate access token"** (or copy the one already shown)
3. Copy the token — this is your `whatsapp_token`

> **Note:** Temporary access tokens expire in **24 hours**. For development this is fine since you'll be actively testing, but you'll need to refresh it periodically. For production, use a System User token (see [Path to Production](#path-to-production)).

### Verify Token

Choose any string — this is a secret you create yourself and share between Meta and the CRM.

- Use a UUID (e.g., run `node -e "console.log(require('crypto').randomUUID())"`) or any random string
- Copy and save it — this is your `whatsapp_verify_token`

## Step 5: Configure Environment Variables

`WHATSAPP_APP_SECRET` is a server-level secret and lives in the environment, not in the database.

**Local development** — add to `apps/api/.env.local`:

```bash
WHATSAPP_APP_SECRET=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
```

**Production** — add to Railway environment variables:

1. Go to your Railway project dashboard
2. Select the API service
3. Click the **"Variables"** tab
4. Add `WHATSAPP_APP_SECRET` with the value from Step 4

The per-user credentials (`whatsapp_phone_id`, `whatsapp_verify_token`, `whatsapp_token`) are configured via the dashboard in the next step.

## Step 6: Configure Agent Credentials in the Dashboard

1. Start the local API (`cd apps/api && pnpm run start:dev`)
2. Open the web dashboard at http://localhost:3000
3. Navigate to **Settings > Agent Configuration**
4. Fill in the WhatsApp fields:
   - **Phone Number ID:** paste the numeric Phone number ID from Step 4
   - **Access Token:** paste the temporary access token from Step 4
   - **Verify Token:** paste the string you chose in Step 4
5. Click **Save**

> **CRITICAL — Do this BEFORE Step 7.** When you configure the webhook callback URL in Meta's dashboard, Meta immediately sends a GET verification request to your API. If `whatsapp_verify_token` is not already set in `agent_config`, the verification will fail and Meta will refuse to save the webhook configuration.

## Step 7: Configure the Webhook in Meta Dashboard

Now that credentials are saved in the CRM, configure the callback URL in Meta.

1. Go to **WhatsApp > Configuration** in the left sidebar
2. Under **"Webhook"**, click **"Edit"**
3. Set the fields:
   - **Callback URL:** `https://abc123.ngrok.io/webhooks/whatsapp`
     - Replace `abc123.ngrok.io` with your current ngrok domain
     - The path must be exactly `/webhooks/whatsapp`
   - **Verify Token:** the same string you saved in `agent_config.whatsapp_verify_token`
4. Click **"Verify and Save"**
   - Meta sends a GET request to your callback URL with `hub.verify_token` and `hub.challenge`
   - The CRM matches the token against all users in `agent_config`, returns the challenge
   - Meta shows **"Complete"** if verification succeeds
5. After saving, click **"Manage"** next to the webhook
6. Subscribe to the **`messages`** field under the **`whatsapp_business_account`** object

**Expected verification flow in API logs:**
```
GET /webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=your-token&hub.challenge=1234567890
200 OK  (returns the challenge value)
```

## Step 8: Verify End-to-End

1. From one of your approved test recipient numbers, send a WhatsApp message to the test phone number
2. Check the API logs for an incoming webhook POST:
   ```
   POST /webhooks/whatsapp 200
   ```
3. Verify signature validation passes — look for absence of this warning:
   ```
   WARN: Raw body not available for signature validation
   ```
4. Check the CRM dashboard — the contact should appear (or be updated) with the incoming message

## Running the Health Check

The webhook registration script includes a WhatsApp health check section:

```bash
cd apps/api
pnpm run register-webhooks
```

The WhatsApp section of the output:
- Confirms `WHATSAPP_APP_SECRET` is set in the environment
- Lists all users with `whatsapp_phone_id` configured in `agent_config`
- Prints the expected webhook URL for comparison with the Meta dashboard

```
WhatsApp health check...
  WHATSAPP_APP_SECRET: set
  Users with whatsapp_phone_id: 1
  Expected webhook URL: https://abc123.ngrok.io/webhooks/whatsapp
  Configure this URL in the Meta developer dashboard.
```

> Unlike Telegram, the script cannot auto-register the WhatsApp webhook via API. The callback URL must be configured manually in the Meta developer dashboard.

## Troubleshooting

### 1. Webhook verification failed in Meta dashboard

Meta shows "Verification failed" or "Error validating callback URL."

**Cause:** Either the CRM is not reachable at the callback URL, or `whatsapp_verify_token` in `agent_config` does not match the Verify Token entered in Meta.

**Fix:**
1. Confirm ngrok is running and the URL is correct: `curl https://abc123.ngrok.io/health` should return `{"status":"ok"}`
2. Confirm `whatsapp_verify_token` is saved in the dashboard (Settings > Agent Configuration) and matches exactly what you typed in Meta — no extra spaces
3. Ensure this is configured **before** clicking "Verify and Save" in Meta (see Step 6 note)

### 2. Messages from a 6th number are silently dropped

The test phone number only delivers messages from the 5 pre-approved recipient numbers. Any other number is silently rejected by Meta — no error, no log entry.

**Fix:** In the Meta dashboard, go to **WhatsApp > API Setup** and add the additional number under **"To"** (up to the 5-number limit). If you need more than 5 numbers during development, rotate out numbers you no longer need.

### 3. "Raw body not available for signature validation" in API logs

WhatsApp signature validation requires the raw request body before JSON parsing. This warning means the raw body middleware is not configured in `main.ts`.

**Fix:** Check `apps/api/src/main.ts` for raw body parser configuration. The `rawBody: true` option must be set on the NestJS app to enable `req.rawBody`. If this warning appears, incoming webhook signatures cannot be verified and the messages will be rejected.

### 4. Using the display phone number instead of Phone Number ID

The CRM's `whatsapp_phone_id` field requires the **numeric Phone Number ID** (e.g., `107853859263817`), not the formatted display phone number (e.g., `+1 555-555-5555`). Using the display number causes API calls to fail.

**Fix:** Go to **WhatsApp > API Setup** in the Meta dashboard. The Phone Number ID is shown as a numeric string below the phone number display. Copy that value into the `whatsapp_phone_id` field in the CRM dashboard.

### 5. Temporary access token expired (24-hour limit)

Meta temporary access tokens expire after 24 hours. After expiry, outgoing messages fail and you may see authentication errors in logs.

**Fix:**
1. Go to **WhatsApp > API Setup** in the Meta dashboard
2. Generate a new temporary token
3. Update `whatsapp_token` in Settings > Agent Configuration in the CRM dashboard

For a persistent token, create a System User (see [Path to Production](#path-to-production)).

---

## Path to Production

> This section documents the steps required to move from test mode to a production WhatsApp deployment. This is future milestone work — not in scope for v1.

### 1. Meta Business Verification

Meta requires business verification before you can send messages to non-test numbers.

1. In Meta Business Settings, go to **Security Center**
2. Complete business verification by submitting business documents (e.g., registration certificate, utility bill showing business address)
3. Verification typically takes **several days to a few weeks**
4. Monitor status in **Business Settings > Business Info**

> Start this process early — it's the longest step and cannot be expedited.

### 2. Production Phone Number

You'll need a dedicated phone number not currently registered with WhatsApp.

1. In the Meta developer dashboard, go to **WhatsApp > Phone Numbers**
2. Click **"Add phone number"**
3. Choose a number type:
   - **Bring your own number:** Use an existing business phone number or purchase one via a VoIP provider (e.g., Twilio)
   - **Meta-provided number:** Available in some regions through Meta's partner network
4. Complete the phone number verification (SMS or voice call to the number)
5. The new number appears in your API Setup as the production "From" number

### 3. Permanent System User Token

Temporary tokens expire in 24 hours. For production, generate a permanent token.

1. In **Meta Business Settings**, go to **Users > System Users**
2. Click **"Add"** and create a system user (e.g., `crm-api-user`) with **Employee** role
3. Click **"Generate new token"** on the system user
4. Select your WhatsApp app
5. Grant permissions: `whatsapp_business_messaging`, `whatsapp_business_management`
6. Copy the generated token — it does not expire
7. Update `whatsapp_token` in `agent_config` (or Railway env vars if using a shared token)

### 4. Update Webhook URL

1. In the Meta developer dashboard, go to **WhatsApp > Configuration**
2. Update the **Callback URL** to your Railway production URL:
   ```
   https://your-api.railway.app/webhooks/whatsapp
   ```
3. Click **"Verify and Save"** — the CRM handles the verification challenge automatically

### 5. Rate Limits

Production phone numbers start at **Tier 1: 1,000 business-initiated conversations per 24 hours**.

- Tiers increase automatically based on message quality and volume
- To increase limits faster, maintain high message quality (low block/report rates)
- Monitor limits in **WhatsApp > Insights** in the Meta dashboard
- See Meta's [Messaging Limits documentation](https://developers.facebook.com/docs/whatsapp/messaging-limits) for tier details
