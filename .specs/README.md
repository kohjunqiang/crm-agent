# Specs

Feature specifications for AI-driven development. Each spec describes **what** to build — the rules in `.rules/` describe **how**.

## Writing a Spec

1. Copy `_template.md` to a new file
2. Name it `<domain>-<feature>.md` (e.g., `contacts-search.md`, `pipeline-drag-drop.md`)
3. Fill in all sections — be specific about acceptance criteria and edge cases
4. Remove sections that don't apply

## Spec Naming Examples

- `contacts-list.md` — Contact list page with search/filter
- `deals-pipeline.md` — Pipeline board with drag-and-drop
- `messaging-whatsapp.md` — WhatsApp conversation view
- `settings-agent-config.md` — Agent configuration page

## Guidelines

- Specs describe WHAT, not HOW — implementation details belong in code
- Acceptance criteria should be testable — "user can X" not "X should work"
- Include edge cases and error states — these are where bugs live
- Keep specs up to date — update when requirements change
