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

## Real integrations (Phase 18 code-complete; requires API keys/accounts)
All integrations are implemented with **live mode when configured** and safe stub/fallback behavior where applicable. Apply migration `0018_integration_tables.sql` and redeploy affected Edge Functions.

### Stripe Connect payouts (end-to-end)
- Functions: `stripe-connect-onboard`, `create-payout`, `stripe-connect-webhook`; `stripe-webhook` verifies signatures.
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_CONNECT_WEBHOOK_SECRET` (optional separate secret), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `SITE_URL`/`NEXT_PUBLIC_APP_URL`.
- Setup: create Stripe Connect (Express) platform; add webhook endpoints for account/transfer/payout events (`stripe-connect-webhook`) and payment intents (`stripe-webhook`). Use `ALLOW_INSECURE_WEBHOOKS=true` only for local dev.
- `create-payout` requires authenticated landlord/agent membership and creates a Stripe transfer to the connected account.

### Plaid (bank linking)
- Web: `POST /api/plaid/create-link-token`, `POST /api/plaid/exchange-token` (live when `PLAID_*` set; stub otherwise).
- Edge Function: `exchange-plaid-token` supports live exchange via Plaid REST API.
- Env: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV` (`sandbox|development|production`), `PLAID_WEBHOOK_URL`.
- Data: stored in `bank_accounts` (migration 0018). **Access tokens are sensitive** - restrict access; consider vault/encryption for production hardening.

### Tenant screening
- Function: `request-screening` (authz: landlord/agent). Supports a generic provider API adapter.
- Env: `SCREENING_API_URL`, `SCREENING_API_KEY`, `SCREENING_PROVIDER`, `SCREENING_WEBHOOK_URL`.
- Note: TransUnion SmartMove typically requires partner onboarding/credentials; configure via the adapter or set provider-specific integration once credentials are available.

### E-signatures
- Function: `send-for-signature` (DocuSign integration path).
- Env: `ESIGN_PROVIDER=docusign`, `DOCUSIGN_BASE_URL`, `DOCUSIGN_ACCOUNT_ID`, `DOCUSIGN_ACCESS_TOKEN` (or implement JWT grant for production), plus `documentBase64` in request.
- Status falls back to `stub/pending_config` when not fully configured.

### Xero (two-way sync)
- Web OAuth/API: `GET /api/xero/connect`, `GET /api/xero/callback`, `POST /api/xero/sync` (push expenses to Xero ACCPAY drafts; pull payments foundation; two-way mode supported).
- Edge Function: `export-xero` remains CSV export (`mode="csv"`); API sync via web route.
- Env: `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `XERO_REDIRECT_URI`, `XERO_SCOPES`, `XERO_EXPENSE_ACCOUNT_CODE`.
- Data: `xero_connections` (migration 0018). Token refresh handled server-side.

### Autopay
- Function: `process-autopay` hardened (Stripe PaymentIntents with idempotency/off-session metadata, payment records, status handling). Requires valid `autopay_settings.payment_method_id` setup for customers/payment methods.

### Apply migration & deploy
```bash
supabase db push
supabase functions deploy stripe-connect-onboard stripe-connect-webhook create-payout stripe-webhook exchange-plaid-token request-screening send-for-signature export-xero process-autopay
supabase secrets set STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... PLAID_CLIENT_ID=... PLAID_SECRET=... XERO_CLIENT_ID=... XERO_CLIENT_SECRET=...
```

## Production Supabase setup (automated)
Run `./scripts/setup-production.sh <project-ref>` to:
1. Link to the project
2. Push all migrations (including 0018)
3. Deploy all Edge Functions
4. Prompt for and set secrets
5. Create storage buckets

## RLS verification (landlord vs tenant)
Run the automated RLS test suite:
```bash
SUPABASE_URL=https://<project>.supabase.co \
SUPABASE_ANON_KEY=<publishable-key> \
SUPABASE_SERVICE_ROLE_KEY=<secret-key> \
pnpm test
```

The test suite (`tests/rls.test.ts`) creates test users (landlord + 2 tenants), seeds a property, and verifies:
- Tenant can read expenses of own property
- Non-member cannot read expenses
- Tenant cannot update/delete/create property
- Landlord can update property and create expenses
- Tenant cannot read stripe_accounts of property
- Non-member cannot read bank_accounts or xero_connections
- Tenant cannot insert into arrears
- All test data is cleaned up after tests

### Manual RLS spot-checks (Supabase SQL editor)
```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true
ORDER BY tablename;

-- Verify policies exist
SELECT tablename, policyname, permissive, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test as a specific user (replace UUID)
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "<user-uuid>", "role": "authenticated"}';
SELECT * FROM properties; -- should only return member properties
RESET ROLE;
```

### Auth redirect URLs checklist
In Supabase Dashboard → Auth → URL Configuration:
- Site URL: `https://<your-netlify-domain>`
- Redirect URLs (add all):
  - `https://<your-netlify-domain>/**`
  - `http://localhost:3000/**` (for local dev)
  - `homehub://` (for mobile deep links)
