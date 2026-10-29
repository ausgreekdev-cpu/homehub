create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references units(id),
  owner_id uuid references profiles(id),
  name text not null,
  brand text,
  model_number text,
  serial_number text,
  category inventory_category not null default 'other',
  condition item_condition not null default 'good',
  purchase_date date,
  purchase_price_cents int,
  replacement_value_cents int,
  current_value_cents int,
  depreciation_rate_pct numeric(5,2),
  warranty_expiry date,
  manual_url text,
  notes text,
  tags text[],
  ai_confidence numeric(4,3),
  ai_raw jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table inventory_photos (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references inventory_items(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  storage_path text not null,
  thumbnail_path text,
  caption text,
  taken_at timestamptz not null default now(),
  exif jsonb,
  is_primary boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table inventory_scans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  storage_path text not null,
  detected_count int not null default 0,
  status text not null default 'pending',
  result jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table inventory_imports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  format text not null,
  storage_path text,
  row_count int,
  status text not null default 'pending',
  errors jsonb,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
