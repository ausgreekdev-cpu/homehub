-- Chart of accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  type text NOT NULL, -- asset, liability, equity, revenue, expense
  parent_id uuid REFERENCES chart_of_accounts(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(property_id, code)
);

-- Journal entries (immutable ledger)
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  description text NOT NULL,
  reference_type text, -- expense, rent, payout, adjustment
  reference_id uuid,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Journal entry lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id uuid REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id uuid REFERENCES chart_of_accounts(id),
  debit_cents integer DEFAULT 0,
  credit_cents integer DEFAULT 0,
  memo text,
  created_at timestamptz DEFAULT now(),
  CHECK (debit_cents >= 0 AND credit_cents >= 0),
  CHECK ((debit_cents > 0 AND credit_cents = 0) OR (credit_cents > 0 AND debit_cents = 0))
);

-- Owner distributions
CREATE TABLE IF NOT EXISTS owner_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  owner_id uuid REFERENCES auth.users(id),
  amount_cents integer NOT NULL,
  distribution_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_coa_property ON chart_of_accounts(property_id);
CREATE INDEX IF NOT EXISTS idx_je_property ON journal_entries(property_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_je_lines_entry ON journal_entry_lines(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_distributions_property ON owner_distributions(property_id);

-- RLS
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE owner_distributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view coa" ON chart_of_accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = chart_of_accounts.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "landlords manage coa" ON chart_of_accounts FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = chart_of_accounts.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view journal entries" ON journal_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = journal_entries.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "landlords manage journal entries" ON journal_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = journal_entries.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view journal lines" ON journal_entry_lines FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM journal_entries je
    JOIN property_memberships pm ON pm.property_id = je.property_id
    WHERE je.id = journal_entry_lines.journal_entry_id AND pm.user_id = auth.uid()
  )
);
CREATE POLICY "members view distributions" ON owner_distributions FOR SELECT USING (
  owner_id = auth.uid() OR EXISTS (
    SELECT 1 FROM property_memberships pm WHERE pm.property_id = owner_distributions.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent')
  )
);
CREATE POLICY "landlords manage distributions" ON owner_distributions FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = owner_distributions.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
