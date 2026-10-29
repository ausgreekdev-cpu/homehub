create table leases (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  tenant_id uuid not null references profiles(id),
  start_date date not null,
  end_date date not null,
  rent_cents int not null,
  rent_period text not null default 'weekly',
  bond_cents int,
  bond_lodged_ref text,
  status text not null default 'active',
  document_storage_path text,
  signed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table rent_ledger (
  id uuid primary key default gen_random_uuid(),
  lease_id uuid not null references leases(id) on delete cascade,
  due_date date not null,
  amount_cents int not null,
  paid_cents int not null default 0,
  paid_at timestamptz,
  status expense_status not null default 'pending',
  payment_id uuid references payments(id),
  created_at timestamptz not null default now()
);

create table condition_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  lease_id uuid references leases(id),
  type report_type not null,
  conducted_by uuid references profiles(id),
  conducted_at timestamptz not null default now(),
  overall_condition text,
  ai_summary jsonb,
  status text not null default 'draft',
  signed_by_tenant_at timestamptz,
  signed_by_landlord_at timestamptz,
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table condition_report_items (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references condition_reports(id) on delete cascade,
  unit_id uuid references units(id),
  area text not null,
  item text not null,
  condition item_condition not null,
  notes text,
  photo_paths text[],
  move_in_photo_paths text[],
  ai_flag text,
  created_at timestamptz not null default now()
);

create table chores (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  description text,
  rotation_member_ids uuid[],
  current_assignee uuid references profiles(id),
  recurrence_rule text,
  next_due_at timestamptz,
  status chore_status not null default 'pending',
  proof_photo_path text,
  completed_by uuid references profiles(id),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table supplies (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  quantity numeric(8,2) not null default 0,
  unit text,
  low_threshold numeric(8,2),
  last_restocked_at timestamptz,
  created_at timestamptz not null default now()
);

create table house_rules (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  body text not null,
  version int not null default 1,
  is_active boolean not null default true,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table rule_signatures (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references house_rules(id) on delete cascade,
  user_id uuid not null references profiles(id),
  signed_at timestamptz not null default now(),
  unique (rule_id, user_id)
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  title text not null,
  category text,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  uploaded_by uuid references profiles(id),
  created_at timestamptz not null default now()
);
