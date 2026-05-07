# Codex Run Log

## 2026-05-07 10:32 BST

- Branch: `feature/initial-foundation`
- Files changed: initial Next.js scaffold, app routes, shell components, Supabase helpers, environment template, and project governance docs.
- Errors: one lint error from calling `setState` inside an effect, plus an unused import warning in the shell.
- Fixes attempted: removed the effect, moved drawer close behavior onto navigation clicks, and cleaned up the unused import.
- Tests run: `npm install`, `npm run lint`, `npm run build`.
- Next recommended step: add Supabase schema migrations and auth/session plumbing, then update the security and schema docs with concrete table/policy definitions.
