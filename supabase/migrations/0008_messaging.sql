create table message_threads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  context_type text not null,
  context_id uuid,
  title text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  last_message_at timestamptz
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references message_threads(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text,
  attachments text[],
  read_by uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
