# Deployment Guide

API runs on [Railway](https://railway.com), web dashboard on [Vercel](https://vercel.com). Both auto-deploy on push to `main`.

## Prerequisites

- Railway account ([railway.com](https://railway.com))
- Vercel account ([vercel.com](https://vercel.com))
- Supabase project credentials (from local dev setup)
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

## Step 1: Deploy API to Railway

1. Create a new project in the Railway dashboard
2. Click **"Deploy from GitHub repo"** and connect this repository
3. Add a service from the repo
4. Set **Root Directory** to `apps/api` (so Railway finds `railway.toml`)
5. Railway auto-detects the Dockerfile via `railway.toml` -- no manual build config needed
6. Go to **Variables** tab and set environment variables:

| Variable | Value | Where to find it |
|----------|-------|-------------------|
| `SUPABASE_URL` | `https://your-project.supabase.co` | Supabase dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase dashboard > Settings > API > service_role |
| `DATABASE_URL` | `postgresql://...` | Supabase dashboard > Settings > Database > Connection string (with pgbouncer) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Anthropic console > API Keys |
| `CORS_ORIGIN` | *(set after Vercel deploy -- see Step 3)* | Will be the Vercel production URL |
| `API_BASE_URL` | `https://<railway-domain>` | Railway dashboard > service > Settings > Networking > Public domain |

> **Do NOT set `PORT`** -- Railway auto-injects it. Setting it manually causes port conflicts.

7. Enable public networking: **Settings > Networking > Generate Domain**
8. Deploy -- Railway auto-builds using the Dockerfile referenced in `railway.toml`
9. Verify the health check:

```bash
curl https://<railway-domain>/health
# Expected: {"status":"ok"}
```

### Railway Config Reference

The `apps/api/railway.toml` configures:
- **Builder:** Dockerfile at `../../Dockerfile` (repo root)
- **Health check:** `GET /health` with 120s timeout
- **Watch patterns:** Only `apps/api/**` and `packages/shared/**` trigger redeploys
- **Restart policy:** On failure, max 3 retries

## Step 2: Deploy Web to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and click **"Import Project"**
2. Connect the GitHub repository
3. Set **Root Directory** to `apps/web`
4. Framework preset: **Next.js** (auto-detected via `vercel.json`)
5. Set environment variables:

| Variable | Value | Where to find it |
|----------|-------|-------------------|
| `NEXT_PUBLIC_API_URL` | `https://<railway-domain>` | Railway domain from Step 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Supabase dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase dashboard > Settings > API > anon public |

> **Important:** `NEXT_PUBLIC_` variables are baked in at build time. If you change them after deploying, you must trigger a redeploy for the changes to take effect.

6. Click **Deploy**

### Vercel Config Reference

The `apps/web/vercel.json` sets the framework to `nextjs`. Vercel handles the build command and output directory automatically.

## Step 3: Connect CORS

After both services are deployed:

1. Copy the Vercel production URL (e.g., `https://agent-crm.vercel.app`)
2. In Railway dashboard, add/update the `CORS_ORIGIN` variable to the Vercel URL
   - Example: `https://agent-crm.vercel.app`
   - **No trailing slash**
3. Railway auto-redeploys with the new CORS setting
4. Verify: open the Vercel URL in a browser, open DevTools (F12) > Console, and confirm no CORS errors when the dashboard calls the API

## Troubleshooting

### Railway

- **Build fails with "Dockerfile not found":**
  Ensure Root Directory is set to `apps/api` in Railway. The `railway.toml` uses `dockerfilePath = "../../Dockerfile"` to reference the Dockerfile at repo root.

- **API crashes with "Cannot find module":**
  Check Railway build logs. The Dockerfile uses `pnpm deploy` to create a minimal production bundle and copies `dist/` separately. Ensure the NestJS build completes before the deploy stage.

- **Health check fails (deploys keep restarting):**
  The health check hits `GET /health` with a 120-second timeout. Check that the API starts without errors by reviewing deploy logs. Common cause: missing required env vars (`SUPABASE_URL`, `DATABASE_URL`, etc.).

### Vercel

- **"No Next.js version detected":**
  Ensure Root Directory is set to `apps/web`. Check that `packageManager` field exists in the root `package.json`.

- **`NEXT_PUBLIC_API_URL` is undefined in the browser:**
  `NEXT_PUBLIC_` vars must be set BEFORE the build. Add/change the variable in Vercel, then trigger a redeploy.

### CORS

- **CORS errors in the browser console:**
  Verify `CORS_ORIGIN` in Railway matches the exact Vercel URL:
  - Must include `https://`
  - Must NOT have a trailing slash
  - Must match exactly (e.g., `https://agent-crm.vercel.app`, not `https://agent-crm.vercel.app/`)

## Environment Variable Reference

See the `.env.example` files for the full list of variables with descriptions:
- **API:** `apps/api/.env.example`
- **Web:** `apps/web/.env.example`
