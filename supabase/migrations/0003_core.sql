create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  email text,
  phone text,
  avatar_url text,
  default_role user_role not null default 'tenant',
  income_bracket text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  suburb text,
  state text,
  postcode text,
  country text not null default 'AU',
  property_type property_type not null default 'house',
  bedrooms int,
  bathrooms int,
  floor_area_sqm numeric(8,2),
  geo geography(point,4326),
  owner_id uuid references profiles(id),
  agent_id uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table property_memberships (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role user_role not null,
  status membership_status not null default 'active',
  room_size_sqm numeric(6,2),
  income_share numeric(5,4),
  move_in_date date,
  move_out_date date,
  invited_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (property_id, user_id)
);

create table units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  floor int,
  created_at timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function handle_new_user() returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, display_name, email, default_role)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email,'@',1)), new.email,
          coalesce((new.raw_user_meta_data->>'default_role')::user_role, 'tenant'));
  return new;
end; $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
