# HomeHub

Comprehensive property & household management platform: shared bills, AI inventory, maintenance dispatch, tenancy compliance.

## Stack
Next.js 15 (PWA) + Supabase (Postgres + RLS + Edge Functions) + Tailwind + shadcn/ui. Monorepo via pnpm.

## Quick start
```bash
cp .env.example .env.local   # fill Supabase + AI keys
pnpm install
supabase start
supabase db reset            # applies migrations + seed
pnpm --filter @homehub/web dev
```

## Structure
See `docs/architecture.md`.

## Phases
Phase 0 foundation scaffolded. See plan for roadmap.
