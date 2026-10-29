# HomeHub Architecture

See plan in conversation for full detail. Summary:

- Monorepo: pnpm workspaces. `apps/web` (Next.js 15 PWA), `packages/shared` (types, zod, utils), `packages/db` (Drizzle mirror, TBD).
- Backend: Supabase (Postgres 15 + RLS, Auth, Storage, Realtime, Edge Functions).
- Migrations: `supabase/migrations/0001..0010`. All applied cleanly in validation.
- RBAC: 4 roles via `property_memberships.role`. RLS uses `is_property_member()` helper.
- AI: Edge Functions `scan-inventory`, `parse-bill`, `diagnose-damage` (GPT-4o Vision).
- State: TanStack Query + Zustand. Offline PWA via next-pwa (Phase 1+ for full offline sync).
