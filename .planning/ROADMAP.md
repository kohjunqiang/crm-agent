# Roadmap: Agent CRM — Environment Setup

## Overview

Three phases take the project from a single-environment codebase with hardcoded secrets to a clean local/production split running on Railway and Vercel, with Telegram Business and WhatsApp Business channels fully configured. Phase 1 hardens the configuration foundation so nothing leaks to production. Phase 2 puts production online. Phase 3 wires up both messaging channels to their correct environments.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Harden env configuration, CORS, startup validation, and health check (completed 2026-03-05)
- [ ] **Phase 2: Production Deployment** - Deploy API to Railway and web to Vercel
- [ ] **Phase 3: Messaging Channels** - Configure Telegram two-bot setup and WhatsApp Cloud API

## Phase Details

### Phase 1: Foundation
**Goal**: Safe, validated environment configuration that works for both local dev and production — secrets separated from defaults, API fails fast on missing vars, CORS reads from env.
**Depends on**: Nothing (first phase)
**Requirements**: R1.1, R1.2, R1.3, R1.4, R1.5, R1.6, R2.2
**Success Criteria** (what must be TRUE):
  1. API refuses to start if `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, or `ANTHROPIC_API_KEY` are absent — error message names the missing variable
  2. CORS accepts requests from `localhost:3000` locally and from the Vercel production URL when `CORS_ORIGIN` env var is set — no hardcoded origins remain in code
  3. `GET /health` returns `{ "status": "ok" }` — Railway can use it as a health check probe
  4. `.env` contains only safe defaults (no secrets), `.env.local` holds secrets and is gitignored — no credentials appear in `git log`
  5. Per-app `.env.example` files document every variable with inline comments
**Plans:** 2/2 plans complete

Plans:
- [ ] 01-01-PLAN.md — Env file restructure, gitignore, and .env.example files
- [ ] 01-02-PLAN.md — Zod env validation, CORS from env, Turbo cache keys, health check

### Phase 2: Production Deployment
**Goal**: NestJS API running on Railway and Next.js dashboard running on Vercel, both connected and passing health checks, deployable via git push to main.
**Depends on**: Phase 1
**Requirements**: R2.1, R2.3, R2.4, R3.1, R3.2, R3.3
**Success Criteria** (what must be TRUE):
  1. `git push` to main triggers a Railway deploy and the API health check passes on the Railway-provided domain
  2. Vercel deploys the Next.js dashboard from `apps/web` — the dashboard loads and authenticates via Supabase
  3. Dashboard running on Vercel can call the Railway API without CORS errors
**Plans:** 2 plans

Plans:
- [ ] 02-01-PLAN.md — Dockerfile, .dockerignore, railway.toml, and vercel.json deployment config
- [ ] 02-02-PLAN.md — Deployment runbook and production verification checkpoint

### Phase 3: Messaging Channels
**Goal**: Dev and prod Telegram bots each point to their correct environment, and WhatsApp Cloud API test number can send and receive messages through the CRM locally.
**Depends on**: Phase 2
**Requirements**: R4.1, R4.2, R4.3, R4.4, R5.1, R5.2, R5.3, R5.4, R5.5
**Success Criteria** (what must be TRUE):
  1. Dev Telegram bot webhooks point to the ngrok URL — messages sent to the dev bot arrive in the local CRM
  2. Prod Telegram bot webhooks point to the Railway URL — messages sent to the prod bot arrive in the production CRM
  3. Re-registration script updates all user webhooks when the ngrok URL changes without manual API calls
  4. WhatsApp test number can send a message that is received and processed by the local CRM (webhook verify challenge passes, inbound message parsed)
**Plans:** 2/3 plans executed

Plans:
- [ ] 03-01-PLAN.md — Register-webhooks script with NODE_ENV guardrail and WhatsApp health check
- [ ] 03-02-PLAN.md — Telegram and WhatsApp setup runbooks with troubleshooting
- [ ] 03-03-PLAN.md — WhatsApp raw body verification and end-to-end channel checkpoint

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-05 |
| 2. Production Deployment | 0/2 | Not started | - |
| 3. Messaging Channels | 2/3 | In Progress|  |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| R1.1 | Phase 1 | Pending |
| R1.2 | Phase 1 | Pending |
| R1.3 | Phase 1 | Pending |
| R1.4 | Phase 1 | Pending |
| R1.5 | Phase 1 | Pending |
| R1.6 | Phase 1 | Pending |
| R2.1 | Phase 2 | Pending |
| R2.2 | Phase 1 | Pending |
| R2.3 | Phase 2 | Pending |
| R2.4 | Phase 2 | Pending |
| R3.1 | Phase 2 | Pending |
| R3.2 | Phase 2 | Pending |
| R3.3 | Phase 2 | Pending |
| R4.1 | Phase 3 | Pending |
| R4.2 | Phase 3 | Pending |
| R4.3 | Phase 3 | Pending |
| R4.4 | Phase 3 | Pending |
| R5.1 | Phase 3 | Pending |
| R5.2 | Phase 3 | Pending |
| R5.3 | Phase 3 | Pending |
| R5.4 | Phase 3 | Pending |
| R5.5 | Phase 3 | Pending |
