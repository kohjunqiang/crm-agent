# Coding Standards

## TypeScript

- Strict mode enabled — no `any`, no implicit returns
- Use Zod for all validation: form inputs, env vars, API payloads
- Prefer `interface` for object shapes, `type` for unions/intersections

## Server Actions

- Every action file starts with `"use server"`
- Return shape: `{ success: boolean, data?: T, error?: string }`
- Validate inputs with Zod before database calls

## React Components

- Functional components only
- Named exports (not default)
- Keep components focused — extract sub-components when a file exceeds ~200 lines

## Styling

- Tailwind utility classes — no CSS modules, no inline styles
- shadcn/ui for all UI primitives (buttons, dialogs, cards, etc.)
- Lucide React for icons
- Use `cn()` utility for conditional classes

## Imports

- Use path aliases: `@/` maps to `apps/web/src/`
- Import shared package as `@agent-crm/shared`
