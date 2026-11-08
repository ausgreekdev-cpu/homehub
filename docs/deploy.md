# Deploying HomeHub (Phase 17)

## Important
- Deploy to a **separate** Netlify/Vercel site for HomeHub (do not mix with Lux or other projects).
- This repo is a pnpm monorepo. Netlify config is in `netlify.toml` (base `apps/web`).

## Netlify (web)
1. **New site** → Import `ausgreekdev-cpu/homehub` (branch `main`).
2. Confirm settings (from `netlify.toml`):
   - Base directory: `apps/web`
   - Build command: `cd ../.. && pnpm install && pnpm --filter @homehub/web build`
   - Publish directory: `.next` (managed with `@netlify/plugin-nextjs`)
3. **Environment variables** (Site settings → Environment variables):
   - `NEXT_PUBLIC_SUPABASE_URL=https://rvivsgnydcfudohxixkf.supabase.co` (or your prod project)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
   - `SUPABASE_SERVICE_ROLE_KEY=<service role key>` (server-side only; needed for API routes/functions that use it)
   - `NEXT_PUBLIC_APP_URL=<your Netlify URL>`
   - Optional: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `OPENAI_API_KEY`, `PLAID_*`, `RESEND_API_KEY`
4. If Netlify UI has custom overrides (e.g., a wrong package path), clear them so `netlify.toml` applies.
5. Deploy. Verify `/api/health` returns `{ ok: true }`.

## Supabase backend
- Current project ref: `rvivsgnydcfudohxixkf` (ap-southeast-2). For true production isolation, create a separate production Supabase project.
1. `supabase link --project-ref <ref>`
2. `supabase db push` (apply migrations in `supabase/migrations/`)
3. `supabase functions deploy` (deploy all functions in `supabase/functions/`)
4. Set secrets: `supabase secrets set OPENAI_API_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... PLAID_CLIENT_ID=... PLAID_SECRET=... RESEND_API_KEY=...`
5. Create/configure storage buckets as needed (`inventory`, `receipts`, `documents`, `condition-reports`) and verify RLS policies.
6. Auth: set Site URL and Redirect URLs to your production domain(s) and mobile deep links (`homehub://`).
7. Stripe webhook: point to `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`.

## Mobile (Expo) - Phase 17 foundation
- Location: `apps/mobile` (Expo Router, Supabase auth + data fetch for core tabs).
- Copy `apps/mobile/.env.example` to `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
- Run: `pnpm --filter @homehub/mobile start`
- Next: push notifications, rent payment flow, create maintenance requests, EAS build/config.

## Post-deploy checks
- [ ] Web loads and `/api/health` is OK
- [ ] Login/signup works against production Supabase
- [ ] RLS works for tenant/landlord roles
- [ ] Stripe webhook configured (if using payments)
- [ ] Supabase Auth redirect URLs include production domain
- [ ] Cron/schedulers for reminders/warranty/arrears as needed

## Phase 17 status (code)
- [x] Netlify/Vercel config, env examples, Node 20
- [x] Next.js upgraded to patched version (CVE fix)
- [x] Lockfile fixed for mobile workspace
- [x] `/api/health` endpoint
- [x] Mobile app foundation (auth + Supabase data for dashboard/payments/maintenance/messages)
- [ ] Actual deploy to a separate Netlify site (requires your Netlify account)
- [ ] Production Supabase project separation (optional but recommended)
- [x] Sentry integration (web) + uptime monitoring docs/health endpoint
- [ ] Real third-party integrations (Stripe Connect payouts end-to-end, Plaid, screening, e-sign, Xero sync)

## Sentry (error monitoring)
- Web uses `@sentry/nextjs` (configured in `apps/web/next.config.ts`, `sentry.*.config.ts`, `instrumentation.ts`).
- Set env vars in your hosting provider:
  - `NEXT_PUBLIC_SENTRY_DSN` (required to enable client/server reporting)
  - `SENTRY_AUTH_TOKEN` (optional, for source map upload in CI/build)
  - `SENTRY_ORG`, `SENTRY_PROJECT` (if using source map upload)
- Without a DSN, Sentry stays effectively disabled. Builds work without `SENTRY_AUTH_TOKEN`.

## Uptime monitoring
- Configure an external monitor (BetterStack, UptimeRobot, Checkly, etc.) against:
  - `https://<your-domain>/api/health` (basic)
  - `https://<your-domain>/api/health?deep=1` (includes lightweight Supabase auth health check; use a reasonable interval)
- Recommended alerts: downtime, high latency, and 5xx rate.
- Also monitor Supabase project health and Edge Function errors from the Supabase dashboard.
