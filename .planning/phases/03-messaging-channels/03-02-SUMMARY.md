---
phase: 03-messaging-channels
plan: 02
subsystem: docs
tags: [telegram, whatsapp, runbook, developer-experience]
dependency_graph:
  requires: []
  provides: [telegram-setup-runbook, whatsapp-setup-runbook]
  affects: [apps/api/scripts/register-webhooks.ts, apps/api/src/config/env.config.ts]
tech_stack:
  added: []
  patterns: [step-by-step runbook, troubleshooting section, path-to-production docs]
key_files:
  created:
    - docs/telegram-setup.md
    - docs/whatsapp-setup.md
  modified: []
decisions:
  - "Bot token exposed in webhook URL documented as known v1 limitation with Telegram secret_token alternative noted as deferred"
  - "WhatsApp verify_token race condition documented prominently: set in agent_config BEFORE configuring Meta webhook callback"
  - "5-recipient test number limitation documented inline in Step 3 rather than relegated to a separate warnings section"
metrics:
  duration: 3min
  completed_date: "2026-03-17"
  tasks: 2
  files_created: 2
  files_modified: 0
---

# Phase 3 Plan 02: Messaging Channel Setup Runbooks Summary

Developer-facing step-by-step runbooks for Telegram (two-bot dev/prod workflow) and WhatsApp Cloud API (test number with path to production).

## What Was Built

Two setup runbooks in `docs/` that a developer can follow start-to-finish to configure messaging channels without tribal knowledge.

**docs/telegram-setup.md** (211 lines, 16 sections):
- BotFather walkthrough for creating two bots (dev + prod)
- Environment configuration — explains bot token is per-user in `agent_config`, not an env var
- Webhook registration via `pnpm run register-webhooks` with expected output
- NODE_ENV guardrail table showing which URL patterns are allowed per environment
- Dev vs prod workflow diagram showing token + URL + environment relationship
- Telegram Business features explanation
- 5-item troubleshooting section

**docs/whatsapp-setup.md** (289 lines, 27 sections):
- 8-step setup: Meta Business account → Cloud API app → test number → credentials → env vars → dashboard config → Meta webhook config → end-to-end verification
- Race condition warning: `whatsapp_verify_token` must be set in `agent_config` before configuring the callback URL in Meta (Meta sends the challenge immediately on save)
- 5-recipient test number limitation documented in Step 3
- `WHATSAPP_APP_SECRET` placement in both `.env.local` and Railway env vars
- Health check section for `pnpm run register-webhooks` WhatsApp output
- 5-item troubleshooting section
- Path to Production section: Meta Business verification, production phone number, System User token, webhook URL update, rate limit tiers

## Requirements Satisfied

| Requirement | How |
|-------------|-----|
| R4.1 — BotFather prod bot creation | Step-by-step BotFather guide in telegram-setup.md with naming and repeat-for-prod instructions |
| R4.4 — Dev vs prod bot workflow | Dedicated section with flow diagram and NODE_ENV guardrail table |
| R5.1 — Meta Business + WhatsApp Cloud API setup | Steps 1–2 in whatsapp-setup.md cover account creation and app configuration |
| R5.2 — 5-recipient test number limitation | Documented in Step 3 with "Critical limitation" callout |
| R5.3 — WHATSAPP_APP_SECRET placement | Step 5 shows both .env.local and Railway configuration |
| R5.5 — Path to production WhatsApp | ## Path to Production section within whatsapp-setup.md |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] docs/telegram-setup.md exists: PASS
- [x] docs/whatsapp-setup.md exists: PASS
- [x] telegram-setup.md references `pnpm run register-webhooks`: PASS
- [x] whatsapp-setup.md references `WHATSAPP_APP_SECRET`: PASS
- [x] Both files have Troubleshooting sections: PASS
- [x] whatsapp-setup.md has Path to Production section: PASS
- [x] Task commits exist: 1fa4f0c, 984b731

## Self-Check: PASSED
