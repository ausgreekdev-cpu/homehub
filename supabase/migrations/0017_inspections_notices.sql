-- Property inspections (move-in/move-out, routine)
CREATE TABLE IF NOT EXISTS inspections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,
  type text NOT NULL, -- move_in, move_out, routine, interim
  status text DEFAULT 'scheduled', -- scheduled, in_progress, completed, reviewed
  scheduled_date date,
  completed_date date,
  inspector_id uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inspection items with photos
CREATE TABLE IF NOT EXISTS inspection_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id uuid REFERENCES inspections(id) ON DELETE CASCADE,
  room text,
  item_name text,
  condition text, -- excellent, good, fair, poor, damaged
  notes text,
  photo_path text,
  move_in_photo_path text, -- for comparison
  move_out_photo_path text,
  created_at timestamptz DEFAULT now()
);

-- Compliance notices
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  lease_id uuid REFERENCES leases(id) ON DELETE SET NULL,
  type text NOT NULL, -- entry_notice, rent_increase, termination, breach, general
  recipient_id uuid REFERENCES auth.users(id),
  title text NOT NULL,
  content text,
  status text DEFAULT 'draft', -- draft, sent, acknowledged
  notice_date date DEFAULT CURRENT_DATE,
  effective_date date,
  notice_period_days integer,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Vendor ratings
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid REFERENCES maintenance_tickets(id) ON DELETE CASCADE,
  contractor_id uuid REFERENCES auth.users(id),
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Bulk announcements
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  sent_by uuid REFERENCES auth.users(id),
  sent_via text[] DEFAULT '{}', -- ['in_app', 'email', 'sms']
  recipient_count integer DEFAULT 0,
  sent_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspections_property ON inspections(property_id);
CREATE INDEX IF NOT EXISTS idx_inspection_items_inspection ON inspection_items(inspection_id);
CREATE INDEX IF NOT EXISTS idx_notices_property ON notices(property_id);
CREATE INDEX IF NOT EXISTS idx_vendor_ratings_contractor ON vendor_ratings(contractor_id);
CREATE INDEX IF NOT EXISTS idx_announcements_property ON announcements(property_id);

-- RLS
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view inspections" ON inspections FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = inspections.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "managers manage inspections" ON inspections FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = inspections.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view inspection items" ON inspection_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM inspections i JOIN property_memberships pm ON pm.property_id = i.property_id WHERE i.id = inspection_items.inspection_id AND pm.user_id = auth.uid())
);
CREATE POLICY "managers manage inspection items" ON inspection_items FOR ALL USING (
  EXISTS (SELECT 1 FROM inspections i JOIN property_memberships pm ON pm.property_id = i.property_id WHERE i.id = inspection_items.inspection_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view notices" ON notices FOR SELECT USING (
  recipient_id = auth.uid() OR EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = notices.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "managers manage notices" ON notices FOR ALL USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = notices.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
CREATE POLICY "members view ratings" ON vendor_ratings FOR SELECT USING (
  EXISTS (SELECT 1 FROM maintenance_tickets t JOIN property_memberships pm ON pm.property_id = t.property_id WHERE t.id = vendor_ratings.ticket_id AND pm.user_id = auth.uid())
);
CREATE POLICY "members create ratings" ON vendor_ratings FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "members view announcements" ON announcements FOR SELECT USING (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = announcements.property_id AND pm.user_id = auth.uid())
);
CREATE POLICY "managers create announcements" ON announcements FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM property_memberships pm WHERE pm.property_id = announcements.property_id AND pm.user_id = auth.uid() AND pm.role IN ('landlord','agent'))
);
