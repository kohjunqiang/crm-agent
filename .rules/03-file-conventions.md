# File Conventions

## Web App (`apps/web/src/`)

| Type | Path | Example |
|------|------|---------|
| Route page | `app/(dashboard)/<feature>/page.tsx` | `app/(dashboard)/clients/page.tsx` |
| Server Action | `app/actions/<domain>.ts` | `app/actions/contacts.ts` |
| Component | `components/<domain>/ComponentName.tsx` | `components/contacts/ContactNotes.tsx` |
| UI primitive | `components/ui/<component>.tsx` | `components/ui/button.tsx` |

- **UI primitives** (`components/ui/`) are from shadcn/ui — don't edit directly, use `npx shadcn@latest add <component>` to add new ones.
- **Domain components** group by feature area (contacts, pipeline, conversation, etc.).

## API (`apps/api/src/`)

| Type | Path |
|------|------|
| Module | `<module>/<module>.module.ts` |
| Controller | `<module>/<module>.controller.ts` |
| Service | `<module>/<module>.service.ts` |

## Shared Package (`packages/shared/src/`)

| Type | Path | Example |
|------|------|---------|
| Zod schema | `schemas/<domain>.ts` | `schemas/note.ts` |
| DB types | `database/types.ts` | Kysely-generated types |
| Migration | `migrations/NNN_description.ts` | `migrations/010_note_images.ts` |

## Naming

- Files: kebab-case for routes, PascalCase for components, camelCase for actions/schemas
- Migrations: zero-padded number prefix (`001_`, `010_`)
