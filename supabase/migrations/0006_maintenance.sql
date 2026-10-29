create table maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references units(id),
  raised_by uuid not null references profiles(id),
  assigned_agent uuid references profiles(id),
  assigned_contractor uuid references profiles(id),
  title text not null,
  description text,
  category trade_category not null default 'general',
  priority ticket_priority not null default 'routine',
  status ticket_status not null default 'open',
  ai_severity text,
  ai_trade_suggestion trade_category,
  ai_cost_min_cents int,
  ai_cost_max_cents int,
  ai_raw jsonb,
  photo_storage_paths text[],
  preferred_times jsonb,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  geofence_center geography(point,4326),
  geofence_radius_m int default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table ticket_quotes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references maintenance_tickets(id) on delete cascade,
  contractor_id uuid not null references profiles(id),
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'AUD',
  description text,
  valid_until date,
  status text not null default 'submitted',
  attachments text[],
  created_at timestamptz not null default now()
);

create table ticket_checkins (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references maintenance_tickets(id) on delete cascade,
  contractor_id uuid not null references profiles(id),
  type text not null,
  location geography(point,4326),
  accuracy_m numeric(6,2),
  within_geofence boolean,
  photo_paths text[],
  notes text,
  created_at timestamptz not null default now()
);

create table ticket_invoices (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references maintenance_tickets(id) on delete cascade,
  contractor_id uuid not null references profiles(id),
  amount_cents int not null check (amount_cents >= 0),
  tax_cents int not null default 0,
  total_cents int not null,
  storage_path text,
  status text not null default 'submitted',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
