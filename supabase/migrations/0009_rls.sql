-- Enable RLS on all tables
alter table profiles enable row level security;
alter table properties enable row level security;
alter table property_memberships enable row level security;
alter table units enable row level security;
alter table expenses enable row level security;
alter table expense_splits enable row level security;
alter table payments enable row level security;
alter table house_wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table inventory_items enable row level security;
alter table inventory_photos enable row level security;
alter table inventory_scans enable row level security;
alter table inventory_imports enable row level security;
alter table maintenance_tickets enable row level security;
alter table ticket_quotes enable row level security;
alter table ticket_checkins enable row level security;
alter table ticket_invoices enable row level security;
alter table leases enable row level security;
alter table rent_ledger enable row level security;
alter table condition_reports enable row level security;
alter table condition_report_items enable row level security;
alter table chores enable row level security;
alter table supplies enable row level security;
alter table house_rules enable row level security;
alter table rule_signatures enable row level security;
alter table documents enable row level security;
alter table message_threads enable row level security;
alter table messages enable row level security;
alter table notifications enable row level security;

create or replace function is_property_member(p_property_id uuid, p_roles user_role[] default null)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from property_memberships m
    where m.property_id = p_property_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and (p_roles is null or m.role = any(p_roles))
  );
$$;

-- profiles
create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_coshare on profiles for select using (
  exists (select 1 from property_memberships a join property_memberships b
          on a.property_id = b.property_id
          where a.user_id = auth.uid() and b.user_id = profiles.id
            and a.status = 'active' and b.status = 'active')
);

-- properties
create policy properties_read on properties for select using (is_property_member(id));
create policy properties_insert on properties for insert with check (auth.uid() is not null);
create policy properties_update on properties for update using (
  owner_id = auth.uid() or agent_id = auth.uid() or is_property_member(id, array['agent']::user_role[])
);
create policy properties_delete on properties for delete using (owner_id = auth.uid());

-- memberships
create policy memberships_read on property_memberships for select using (is_property_member(property_id));
create policy memberships_manage on property_memberships for all using (
  is_property_member(property_id, array['landlord','agent']::user_role[])
) with check (is_property_member(property_id, array['landlord','agent']::user_role[]));

-- units
create policy units_rw on units for all using (is_property_member(property_id)) with check (is_property_member(property_id));

-- expenses
create policy expenses_read on expenses for select using (is_property_member(property_id));
create policy expenses_insert on expenses for insert with check (is_property_member(property_id));
create policy expenses_update on expenses for update using (
  created_by = auth.uid() or is_property_member(property_id, array['landlord','agent']::user_role[])
);
create policy expenses_delete on expenses for delete using (
  created_by = auth.uid() or is_property_member(property_id, array['landlord','agent']::user_role[])
);

-- expense_splits
create policy splits_read on expense_splits for select using (
  exists (select 1 from expenses e where e.id = expense_splits.expense_id and is_property_member(e.property_id))
);
create policy splits_write on expense_splits for all using (
  exists (select 1 from expenses e where e.id = expense_splits.expense_id and
    (e.created_by = auth.uid() or is_property_member(e.property_id, array['landlord','agent']::user_role[])))
);

-- payments
create policy payments_read on payments for select using (
  exists (select 1 from expenses e where e.id = payments.expense_id and is_property_member(e.property_id))
  or payer_id = auth.uid()
);
create policy payments_insert on payments for insert with check (payer_id = auth.uid());

-- wallets
create policy wallets_read on house_wallets for select using (is_property_member(property_id));
create policy wallets_manage on house_wallets for all using (is_property_member(property_id, array['landlord','agent']::user_role[]));
create policy wtxn_read on wallet_transactions for select using (
  exists (select 1 from house_wallets w where w.id = wallet_transactions.wallet_id and is_property_member(w.property_id))
);

-- inventory
create policy inv_read on inventory_items for select using (is_property_member(property_id));
create policy inv_insert on inventory_items for insert with check (is_property_member(property_id));
create policy inv_update on inventory_items for update using (
  owner_id is null or owner_id = auth.uid() or is_property_member(property_id, array['landlord','agent']::user_role[])
);
create policy inv_delete on inventory_items for delete using (
  owner_id = auth.uid() or is_property_member(property_id, array['landlord','agent']::user_role[])
);
create policy invphotos_rw on inventory_photos for all using (is_property_member(property_id)) with check (is_property_member(property_id));
create policy invscans_rw on inventory_scans for all using (is_property_member(property_id)) with check (is_property_member(property_id));
create policy invimports_rw on inventory_imports for all using (is_property_member(property_id)) with check (is_property_member(property_id));

-- maintenance
create policy tickets_read on maintenance_tickets for select using (is_property_member(property_id));
create policy tickets_insert on maintenance_tickets for insert with check (is_property_member(property_id));
create policy tickets_update on maintenance_tickets for update using (
  raised_by = auth.uid() or assigned_agent = auth.uid() or assigned_contractor = auth.uid()
  or is_property_member(property_id, array['landlord','agent']::user_role[])
);
create policy tquotes_read on ticket_quotes for select using (
  exists (select 1 from maintenance_tickets t where t.id = ticket_quotes.ticket_id and is_property_member(t.property_id))
);
create policy tquotes_write on ticket_quotes for all using (contractor_id = auth.uid()) with check (contractor_id = auth.uid());
create policy tquotes_approve on ticket_quotes for update using (
  exists (select 1 from maintenance_tickets t where t.id = ticket_quotes.ticket_id and is_property_member(t.property_id, array['landlord','agent']::user_role[]))
);
create policy tcheckins_rw on ticket_checkins for all using (contractor_id = auth.uid()) with check (contractor_id = auth.uid());
create policy tcheckins_read on ticket_checkins for select using (
  exists (select 1 from maintenance_tickets t where t.id = ticket_checkins.ticket_id and is_property_member(t.property_id))
);
create policy tinvoices_read on ticket_invoices for select using (
  exists (select 1 from maintenance_tickets t where t.id = ticket_invoices.ticket_id and is_property_member(t.property_id))
);
create policy tinvoices_write on ticket_invoices for all using (contractor_id = auth.uid()) with check (contractor_id = auth.uid());
create policy tinvoices_approve on ticket_invoices for update using (
  exists (select 1 from maintenance_tickets t where t.id = ticket_invoices.ticket_id and is_property_member(t.property_id, array['landlord','agent']::user_role[]))
);

-- tenancy
create policy leases_read on leases for select using (is_property_member(property_id));
create policy leases_write on leases for all using (is_property_member(property_id, array['landlord','agent']::user_role[])) with check (is_property_member(property_id, array['landlord','agent']::user_role[]));
create policy rentledger_read on rent_ledger for select using (
  exists (select 1 from leases l where l.id = rent_ledger.lease_id and is_property_member(l.property_id))
);
create policy cr_read on condition_reports for select using (is_property_member(property_id));
create policy cr_write on condition_reports for all using (is_property_member(property_id, array['landlord','agent']::user_role[])) with check (is_property_member(property_id, array['landlord','agent']::user_role[]));
create policy cri_rw on condition_report_items for all using (
  exists (select 1 from condition_reports c where c.id = condition_report_items.report_id and is_property_member(c.property_id))
) with check (
  exists (select 1 from condition_reports c where c.id = condition_report_items.report_id and is_property_member(c.property_id))
);
create policy chores_rw on chores for all using (is_property_member(property_id)) with check (is_property_member(property_id));
create policy supplies_rw on supplies for all using (is_property_member(property_id)) with check (is_property_member(property_id));
create policy rules_read on house_rules for select using (is_property_member(property_id));
create policy rules_write on house_rules for all using (is_property_member(property_id, array['landlord','agent']::user_role[])) with check (is_property_member(property_id, array['landlord','agent']::user_role[]));
create policy rulesig_rw on rule_signatures for all using (
  exists (select 1 from house_rules r where r.id = rule_signatures.rule_id and is_property_member(r.property_id))
) with check (user_id = auth.uid());
create policy docs_rw on documents for all using (is_property_member(property_id)) with check (is_property_member(property_id));

-- messaging
create policy threads_read on message_threads for select using (is_property_member(property_id));
create policy threads_insert on message_threads for insert with check (is_property_member(property_id));
create policy msgs_read on messages for select using (
  exists (select 1 from message_threads t where t.id = messages.thread_id and is_property_member(t.property_id))
);
create policy msgs_insert on messages for insert with check (
  sender_id = auth.uid() and exists (select 1 from message_threads t where t.id = messages.thread_id and is_property_member(t.property_id))
);
-- notifications: own only
create policy notif_own on notifications for all using (user_id = auth.uid()) with check (user_id = auth.uid());
