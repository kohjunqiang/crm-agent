# Workflow

## Before Implementing

1. Read relevant `.specs/` file for the feature — if no spec exists, ask before building
2. Check `.rules/` if unsure about conventions or where to put things
3. Read existing code in the area you're modifying before making changes

## Implementation

- Server Actions for new CRUD, NestJS only when a persistent process is needed
- Don't create files unless necessary — prefer editing existing ones
- Don't over-engineer — solve the current requirement, not hypothetical future ones
- Prefer simple, readable code over clever abstractions

## Verification

- Run `pnpm build` to verify the project compiles before considering work done
- Test the feature manually if possible

## Git

- Commit messages: imperative mood, concise (e.g., "add contact search", "fix deal stage transition")
- Don't commit `.env` files or secrets
