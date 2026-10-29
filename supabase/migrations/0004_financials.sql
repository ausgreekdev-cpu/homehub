create table expenses (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_id uuid references units(id),
  created_by uuid not null references profiles(id),
  type expense_type not null default 'other',
  title text not null,
  description text,
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'AUD',
  due_date date,
  incurred_date date not null default current_date,
  split_method split_method not null default 'equal',
  status expense_status not null default 'pending',
  receipt_storage_path text,
  parsed_total_cents int,
  parsed_due_date date,
  parsed_line_items jsonb,
  recurrence_rule text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table expense_splits (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  user_id uuid not null references profiles(id),
  share_cents int not null check (share_cents >= 0),
  percentage numeric(5,2),
  days_occupied int,
  paid_cents int not null default 0,
  paid_at timestamptz,
  status expense_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (expense_id, user_id)
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid references expenses(id),
  split_id uuid references expense_splits(id),
  payer_id uuid not null references profiles(id),
  amount_cents int not null check (amount_cents > 0),
  currency text not null default 'AUD',
  provider text not null default 'stripe',
  provider_ref text,
  status text not null default 'pending',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create table house_wallets (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references properties(id) on delete cascade,
  balance_cents int not null default 0,
  currency text not null default 'AUD',
  stripe_account_id text,
  updated_at timestamptz not null default now()
);

create table wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references house_wallets(id) on delete cascade,
  user_id uuid references profiles(id),
  type text not null,
  amount_cents int not null,
  balance_after_cents int not null,
  reference text,
  created_at timestamptz not null default now()
);
