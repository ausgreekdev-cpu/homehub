# Deploying HomeHub

## Backend (Supabase)
1. Create a Supabase project (region closest to users).
2. Link locally: `supabase link --project-ref <ref>`.
3. Push schema: `supabase db push`.
4. Deploy functions: `supabase functions deploy` (all functions in `supabase/functions`).
5. Create storage buckets: `inventory`, `receipts`, `documents`, `condition-reports` (public/private as needed; RLS policies apply).
6. Set function secrets: `supabase secrets set OPENAI_API_KEY=... STRIPE_SECRET_KEY=... STRIPE_WEBHOOK_SECRET=... PLAID_CLIENT_ID=... PLAID_SECRET=... PLAID_ENV=production`.
7. Configure Auth: site URL + redirect URLs (`https://<your-domain>`, `homehub://`).

## Frontend (Vercel or Netlify)
- Root directory: `apps/web`
- Build command: `pnpm install && pnpm --filter @homehub/web build` (or `cd ../.. && pnpm install && pnpm --filter @homehub/web build`)
- Output: `apps/web/.next`
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_DEFAULT_CURRENCY`.

## Post-deploy
- Set Stripe webhook endpoint to `https://<supabase>/functions/v1/stripe-webhook`.
- Schedule `send-reminder` and `warranty-check` via Supabase cron (pg_cron) or external scheduler.
- Run RLS tests against production with a test tenant/landlord pair (see `tests/README.md`).
- Enable PWA install prompt (already configured via next-pwa).

## Rollback
- Revert the git commit and redeploy; Supabase migrations are forward-only (write a new migration to revert schema).
