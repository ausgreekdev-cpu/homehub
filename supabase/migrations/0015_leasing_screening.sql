-- Rental listings
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  rent_cents integer NOT NULL,
  bedrooms integer,
  bathrooms numeric(3,1),
  address text,
  available_from date,
  status text DEFAULT 'draft',
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Rental applications
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE,
  applicant_user_id uuid REFERENCES auth.users(id),
  first_name text,
  last_name text,
  email text,
  phone text,
  employment_status text,
  income_cents integer,
  applicant_references jsonb DEFAULT '[]',
  answers jsonb DEFAULT '{}',
  application_fee_cents integer DEFAULT 5000,
  fee_paid boolean DEFAULT false,
  status text DEFAULT 'submitted',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tenant screening
CREATE TABLE IF NOT EXISTS screenings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES applications(id) ON DELETE CASCADE,
  provider text DEFAULT 'smartmove',
  report_id text,
  status text DEFAULT 'pending',
  result jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Lease documents for e-sign
CREATE TABLE IF NOT EXISTS lease_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lease_id uuid REFERENCES leases(id) ON DELETE CASCADE,
  document_url text,
  status text DEFAULT 'draft',
  signers jsonb DEFAULT '[]',
  signed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_listings_property ON listings(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_listing ON applications(listing_id);
CREATE INDEX IF NOT EXISTS idx_screenings_app ON screenings(application_id);

-- RLS
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lease_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone view published listings" ON listings FOR SELECT USING (published = true);
CREATE POLICY "members manage listings" ON listings FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = listings.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "applicants view own applications" ON applications FOR SELECT USING (applicant_user_id = auth.uid());
CREATE POLICY "anyone submit applications" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "landlords view applications" ON applications FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM listings l
    JOIN property_memberships pm ON pm.property_id = l.property_id
    WHERE l.id = applications.listing_id AND pm.user_id = auth.uid()
  )
);
CREATE POLICY "landlords manage applications" ON applications FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM listings l
    JOIN property_memberships pm ON pm.property_id = l.property_id
    WHERE l.id = applications.listing_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent')
  )
);
CREATE POLICY "landlords view screenings" ON screenings FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM applications a
    JOIN listings l ON l.id = a.listing_id
    JOIN property_memberships pm ON pm.property_id = l.property_id
    WHERE a.id = screenings.application_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent')
  )
);
