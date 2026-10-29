# Nhost Migration Plan

Branch: `nhost`. Goal: port HomeHub from Supabase to Nhost (Postgres + Hasura + Auth + Storage + Functions).

## What changes
| Supabase | Nhost |
|---|---|
| `@supabase/supabase-js` client | `@nhost/nhost-js` (auth, storage, graphql, functions) |
| PostgREST `.from().select()` | Hasura GraphQL queries/mutations |
| RLS policies | Hasura permission rules (or keep Postgres RLS via Nhost's RLS support) |
| `auth.users` + `auth.uid()` | Nhost auth (`auth.users` schema, `x-hasura-user-id`) |
| Storage buckets | Nhost Storage |
| Edge Functions (Deno) | Nhost Functions (Node/TS) |
| Realtime subscriptions | Hasura subscriptions / Nhost realtime |
| `supabase/migrations` | Hasura migrations + SQL |

## Phases
1. **Foundation**: install `@nhost/nhost-js`, create client wrapper, swap auth (login/signup), env vars.
2. **Data layer**: convert each `.from().select/insert/update` to GraphQL operations (properties, expenses, inventory, tickets, messages, etc.).
3. **Permissions**: port RLS to Hasura permission rules.
4. **Storage**: swap upload/signed-url calls to Nhost storage.
5. **Functions**: port Edge Functions to Nhost Functions (Node).
6. **Realtime**: convert message/ticket subscriptions to Hasura subscriptions.

## Notes
- Nhost uses Hasura GraphQL; the biggest effort is converting the PostgREST-style queries in `apps/web`.
- Consider keeping Postgres RLS as a defense-in-depth layer (Nhost supports it) to reduce permission rewrite risk.
- Schema (tables) is reusable as-is; only auth/permission wiring changes.

## Status
Branch created. Migration not yet started. Say "proceed" to begin Phase 1 (foundation).
