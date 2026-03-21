# Architecture

## Hybrid Pattern

This project uses a split architecture:

- **Next.js Server Actions (Vercel):** All CRUD operations — contacts, deals, payments, tasks, notes, knowledge base, activities, config reads. Direct Supabase calls via server client.
- **NestJS API (Railway):** Webhooks (Telegram/WhatsApp), AI agent loop (Claude + tool execution), config writes with webhook setup, human message sending (triggers agent). Anything needing a persistent process.

## When to Use What

| Need | Where |
|------|-------|
| New CRUD feature | Server Action in `apps/web/src/app/actions/` |
| Webhook handler | NestJS module in `apps/api/src/` |
| Agent tool | NestJS agent module |
| Background job | NestJS (pg-boss planned) |
| Database migration | `packages/shared/migrations/` |

## Data Flow

- Web app authenticates via Supabase Auth
- Server Actions use Supabase server client (user's auth context)
- NestJS uses Supabase service role client (elevated access)
- Agent tools write to Supabase directly via service role

## Deal Stages

The business follows this pipeline:

`discovery` → `consultation` → `quotation_sent` → `confirmed` → `ordered` → `fulfilled` → `completed`

Plus `lost` (reachable from any stage).

- Agent can auto-advance: discovery, consultation, lost
- Human-only stages: quotation_sent through completed

## Payment Model

- Flexible N payments per deal (not just deposit/final)
- Common pattern: 50% deposit, 50% on fulfillment
- Use free-text `label` on payments — don't hardcode payment types
- Deal stage advances on human confirmation, not payment count
