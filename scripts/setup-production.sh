#!/usr/bin/env bash
# Production Supabase setup script for HomeHub
# Usage: ./scripts/setup-production.sh <project-ref>
# Prerequisites: supabase CLI installed and authenticated

set -euo pipefail

PROJECT_REF="${1:?Usage: $0 <project-ref>}"

echo "=== HomeHub Production Supabase Setup ==="
echo "Project ref: $PROJECT_REF"

# 1. Link project
echo ""
echo "1. Linking to project..."
supabase link --project-ref "$PROJECT_REF"

# 2. Push migrations
echo ""
echo "2. Pushing database migrations..."
supabase db push

# 3. Deploy all Edge Functions
echo ""
echo "3. Deploying Edge Functions..."
for fn in $(ls supabase/functions | grep -v _shared); do
  echo "  Deploying $fn..."
  supabase functions deploy "$fn"
done

# 4. Set secrets (prompt for values)
echo ""
echo "4. Set secrets (enter values or press Enter to skip):"
read -p "  OPENAI_API_KEY: " OPENAI_API_KEY
read -p "  STRIPE_SECRET_KEY: " STRIPE_SECRET_KEY
read -p "  STRIPE_WEBHOOK_SECRET: " STRIPE_WEBHOOK_SECRET
read -p "  STRIPE_CONNECT_WEBHOOK_SECRET: " STRIPE_CONNECT_WEBHOOK_SECRET
read -p "  PLAID_CLIENT_ID: " PLAID_CLIENT_ID
read -p "  PLAID_SECRET: " PLAID_SECRET
read -p "  PLAID_ENV (sandbox/development/production): " PLAID_ENV
read -p "  RESEND_API_KEY: " RESEND_API_KEY
read -p "  SCREENING_API_URL: " SCREENING_API_URL
read -p "  SCREENING_API_KEY: " SCREENING_API_KEY
read -p "  DOCUSIGN_BASE_URL: " DOCUSIGN_BASE_URL
read -p "  DOCUSIGN_ACCOUNT_ID: " DOCUSIGN_ACCOUNT_ID
read -p "  DOCUSIGN_ACCESS_TOKEN: " DOCUSIGN_ACCESS_TOKEN
read -p "  XERO_CLIENT_ID: " XERO_CLIENT_ID
read -p "  XERO_CLIENT_SECRET: " XERO_CLIENT_SECRET

SECRETS=""
[ -n "$OPENAI_API_KEY" ] && SECRETS="$SECRETS OPENAI_API_KEY=$OPENAI_API_KEY"
[ -n "$STRIPE_SECRET_KEY" ] && SECRETS="$SECRETS STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY"
[ -n "$STRIPE_WEBHOOK_SECRET" ] && SECRETS="$SECRETS STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET"
[ -n "$STRIPE_CONNECT_WEBHOOK_SECRET" ] && SECRETS="$SECRETS STRIPE_CONNECT_WEBHOOK_SECRET=$STRIPE_CONNECT_WEBHOOK_SECRET"
[ -n "$PLAID_CLIENT_ID" ] && SECRETS="$SECRETS PLAID_CLIENT_ID=$PLAID_CLIENT_ID"
[ -n "$PLAID_SECRET" ] && SECRETS="$SECRETS PLAID_SECRET=$PLAID_SECRET"
[ -n "$PLAID_ENV" ] && SECRETS="$SECRETS PLAID_ENV=$PLAID_ENV"
[ -n "$RESEND_API_KEY" ] && SECRETS="$SECRETS RESEND_API_KEY=$RESEND_API_KEY"
[ -n "$SCREENING_API_URL" ] && SECRETS="$SECRETS SCREENING_API_URL=$SCREENING_API_URL"
[ -n "$SCREENING_API_KEY" ] && SECRETS="$SECRETS SCREENING_API_KEY=$SCREENING_API_KEY"
[ -n "$DOCUSIGN_BASE_URL" ] && SECRETS="$SECRETS DOCUSIGN_BASE_URL=$DOCUSIGN_BASE_URL"
[ -n "$DOCUSIGN_ACCOUNT_ID" ] && SECRETS="$SECRETS DOCUSIGN_ACCOUNT_ID=$DOCUSIGN_ACCOUNT_ID"
[ -n "$DOCUSIGN_ACCESS_TOKEN" ] && SECRETS="$SECRETS DOCUSIGN_ACCESS_TOKEN=$DOCUSIGN_ACCESS_TOKEN"
[ -n "$XERO_CLIENT_ID" ] && SECRETS="$SECRETS XERO_CLIENT_ID=$XERO_CLIENT_ID"
[ -n "$XERO_CLIENT_SECRET" ] && SECRETS="$SECRETS XERO_CLIENT_SECRET=$XERO_CLIENT_SECRET"

if [ -n "$SECRETS" ]; then
  echo "  Setting secrets..."
  supabase secrets set $SECRETS
else
  echo "  No secrets set (skipped)"
fi

# 5. Create storage buckets
echo ""
echo "5. Creating storage buckets..."
for bucket in inventory receipts documents condition-reports; do
  echo "  Creating bucket: $bucket"
  supabase storage create "$bucket" 2>/dev/null || echo "  (bucket may already exist)"
done

echo ""
echo "=== Setup complete ==="
echo ""
echo "Next steps:"
echo "  1. Configure Auth redirect URLs in Supabase Dashboard"
echo "  2. Set Netlify env vars to point to this project"
echo "  3. Configure Stripe webhook: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "  4. Configure Stripe Connect webhook: https://$PROJECT_REF.supabase.co/functions/v1/stripe-connect-webhook"
echo "  5. Run RLS tests: SUPABASE_URL=https://$PROJECT_REF.supabase.co SUPABASE_ANON_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> pnpm test"
