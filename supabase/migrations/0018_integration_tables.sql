-- Bank accounts / Plaid items (for ACH/rent collection integrations)
CREATE TABLE IF NOT EXISTS bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  provider text DEFAULT 'plaid',
  plaid_item_id text,
  plaid_access_token text, -- store encrypted at rest in production; restrict access via service role only
  institution_name text,
  institution_id text,
  account_name text,
  account_mask text,
  account_type text,
  account_subtype text,
  status text DEFAULT 'active',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Xero OAuth connections for two-way sync
CREATE TABLE IF NOT EXISTS xero_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  tenant_id text, -- Xero tenant/org ID
  tenant_name text,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] DEFAULT '{}',
  status text DEFAULT 'active',
  last_sync_at timestamptz,
  sync_cursor jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id, tenant_id)
);

-- Generic webhook/integration event log for idempotency and auditing
CREATE TABLE IF NOT EXISTS integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text,
  event_type text,
  object_id text,
  payload jsonb DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  UNIQUE(provider, event_id)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_property ON bank_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_xero_connections_property ON xero_connections(property_id);
CREATE INDEX IF NOT EXISTS idx_integration_events_provider ON integration_events(provider, event_type);

ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xero_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_events ENABLE ROW LEVEL SECURITY;

-- bank_accounts: members can view non-sensitive fields via app logic; direct access restricted.
-- Allow property members to view limited info; tokens should never be selected by clients.
CREATE POLICY "members view bank accounts" ON bank_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = bank_accounts.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "landlords manage bank accounts" ON bank_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = bank_accounts.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
  OR user_id = auth.uid()
);

CREATE POLICY "users manage xero connections" ON xero_connections FOR ALL USING (user_id = auth.uid());
CREATE POLICY "admins view integration events" ON integration_events FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);
