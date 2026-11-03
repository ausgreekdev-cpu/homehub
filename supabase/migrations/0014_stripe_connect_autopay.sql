-- Stripe Connect accounts for landlords/agents
CREATE TABLE IF NOT EXISTS stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  stripe_account_id text UNIQUE,
  onboarding_complete boolean DEFAULT false,
  charges_enabled boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Autopay settings
CREATE TABLE IF NOT EXISTS autopay_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  enabled boolean DEFAULT false,
  payment_method_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, property_id)
);

-- Late fees configuration
CREATE TABLE IF NOT EXISTS late_fee_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  grace_period_days integer DEFAULT 5,
  late_fee_amount_cents integer DEFAULT 5000,
  late_fee_percent numeric(5,2) DEFAULT 0,
  max_late_fee_cents integer,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Arrears tracking
CREATE TABLE IF NOT EXISTS arrears (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  expense_split_id uuid REFERENCES expense_splits(id) ON DELETE CASCADE,
  amount_due_cents integer NOT NULL,
  days_overdue integer DEFAULT 0,
  late_fee_applied_cents integer DEFAULT 0,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payouts log
CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id text,
  stripe_payout_id text,
  amount_cents integer,
  currency text DEFAULT 'aud',
  status text,
  arrived_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_user ON stripe_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_property ON stripe_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_autopay_user ON autopay_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_arrears_property ON arrears(property_id);
CREATE INDEX IF NOT EXISTS idx_arrears_status ON arrears(status);

-- RLS
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopay_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE late_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrears ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own stripe accounts" ON stripe_accounts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "users manage own autopay" ON autopay_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "members view property late fees" ON late_fee_rules FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = late_fee_rules.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "landlords manage late fees" ON late_fee_rules FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = late_fee_rules.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view arrears" ON arrears FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = arrears.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "landlords manage arrears" ON arrears FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = arrears.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
