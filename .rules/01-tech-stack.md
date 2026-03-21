# Tech Stack

## Monorepo

- **Package manager:** pnpm 10.x with workspaces
- **Orchestration:** Turborepo
- **Structure:** `apps/web`, `apps/api`, `packages/shared`

## Frontend (`apps/web`)

- Next.js 15 (App Router)
- React 19
- TypeScript 5 (strict mode)
- Tailwind CSS v4 — do NOT add `@source` to globals.css, v4 auto-detects
- shadcn/ui (new-york style)
- Lucide React for icons
- Supabase client (SSR)

## Backend (`apps/api`)

- NestJS 10
- TypeScript 5 (strict mode)
- Supabase JS (service role)
- Anthropic Claude SDK

## Shared (`packages/shared`)

- Kysely (type-safe SQL query builder)
- Zod (schema validation)
- PostgreSQL driver (pg)

## Database & Auth

- Supabase (PostgreSQL + Auth)

## Deployment

- Web: Vercel
- API: Railway (Docker)
