create or replace function generate_rent_ledger() returns trigger language plpgsql as $$
declare
  step interval;
  cur date;
  amt int;
begin
  if new.rent_period = 'weekly' then step := interval '7 days';
  elsif new.rent_period = 'fortnightly' then step := interval '14 days';
  else step := interval '1 month';
  end if;
  amt := new.rent_cents;
  cur := new.start_date;
  while cur <= new.end_date loop
    insert into rent_ledger (lease_id, due_date, amount_cents) values (new.id, cur, amt);
    cur := cur + step;
  end loop;
  return new;
end; $$;

create trigger trg_generate_rent_ledger after insert on leases
  for each row execute function generate_rent_ledger();
