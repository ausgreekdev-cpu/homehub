import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const ANON = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ready = !!URL && !!SERVICE && !!ANON;

const admin = ready ? createClient(URL!, SERVICE!, { auth: { persistSession: false } }) : null;

describe.skipIf(!ready)('RLS isolation', () => {
  let propertyId: string;
  let tenantClient: SupabaseClient;
  let landlordClient: SupabaseClient;
  let otherTenantClient: SupabaseClient;
  let tenant1Id: string;
  let tenant2Id: string;
  let landlordId: string;

  beforeAll(async () => {
    // Seed two users + a property. Assumes auth users created via service role.
    const { data: t1 } = await admin!.auth.admin.createUser({ email: 'tenant1@test.local', password: 'password123', email_confirm: true });
    const { data: t2 } = await admin!.auth.admin.createUser({ email: 'tenant2@test.local', password: 'password123', email_confirm: true });
    const { data: ll } = await admin!.auth.admin.createUser({ email: 'landlord@test.local', password: 'password123', email_confirm: true });

    tenant1Id = t1.user!.id;
    tenant2Id = t2.user!.id;
    landlordId = ll.user!.id;

    const { data: prop } = await admin!.from('properties').insert({ name: 'RLS Test Property', address: '1 Test St', owner_id: landlordId }).select().single();
    propertyId = prop.id;

    await admin!.from('property_memberships').insert([
      { property_id: propertyId, user_id: tenant1Id, role: 'tenant' },
      { property_id: propertyId, user_id: landlordId, role: 'landlord' },
    ]);

    // anon clients
    tenantClient = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await tenantClient.auth.signInWithPassword({ email: 'tenant1@test.local', password: 'password123' });
    landlordClient = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await landlordClient.auth.signInWithPassword({ email: 'landlord@test.local', password: 'password123' });
    otherTenantClient = createClient(URL!, ANON!, { auth: { persistSession: false } });
    await otherTenantClient.auth.signInWithPassword({ email: 'tenant2@test.local', password: 'password123' });
  });

  it('tenant can read expenses of own property', async () => {
    await admin!.from('expenses').insert({ property_id: propertyId, title: 'Test bill', amount_cents: 1000, created_by: tenant1Id });
    const { data, error } = await tenantClient.from('expenses').select('*').eq('property_id', propertyId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('non-member cannot read expenses', async () => {
    const { data } = await otherTenantClient.from('expenses').select('*').eq('property_id', propertyId);
    expect((data ?? []).length).toBe(0);
  });

  it('tenant cannot update property', async () => {
    const { error } = await tenantClient.from('properties').update({ name: 'Hacked' }).eq('id', propertyId);
    expect(error).not.toBeNull();
  });

  it('landlord can update property', async () => {
    const { error } = await landlordClient.from('properties').update({ name: 'Updated' }).eq('id', propertyId);
    expect(error).toBeNull();
  });

  it('tenant cannot create property', async () => {
    const { error } = await tenantClient.from('properties').insert({ name: 'New Prop', address: '2 Test St', owner_id: tenant1Id });
    expect(error).not.toBeNull();
  });

  it('landlord can create expense', async () => {
    const { error } = await landlordClient.from('expenses').insert({ property_id: propertyId, title: 'Landlord expense', amount_cents: 500, created_by: landlordId });
    expect(error).toBeNull();
  });

  it('tenant cannot delete property', async () => {
    const { error } = await tenantClient.from('properties').delete().eq('id', propertyId);
    expect(error).not.toBeNull();
  });

  it('non-member cannot read bank accounts', async () => {
    const { data } = await otherTenantClient.from('bank_accounts').select('*').eq('property_id', propertyId);
    expect((data ?? []).length).toBe(0);
  });

  it('landlord can read own stripe accounts', async () => {
    const { data, error } = await landlordClient.from('stripe_accounts').select('*').eq('property_id', propertyId);
    expect(error).toBeNull();
  });

  it('tenant cannot read stripe accounts of property', async () => {
    const { data } = await tenantClient.from('stripe_accounts').select('*').eq('property_id', propertyId);
    // RLS should block or return empty
    expect((data ?? []).length).toBe(0);
  });

  it('non-member cannot read xero connections', async () => {
    const { data } = await otherTenantClient.from('xero_connections').select('*');
    expect((data ?? []).length).toBe(0);
  });

  it('tenant cannot insert into arrears', async () => {
    const { error } = await tenantClient.from('arrears').insert({ property_id: propertyId, user_id: tenant1Id, amount_due_cents: 100 });
    expect(error).not.toBeNull();
  });

  afterAll(async () => {
    // cleanup
    if (propertyId) {
      await admin!.from('expenses').delete().eq('property_id', propertyId);
      await admin!.from('property_memberships').delete().eq('property_id', propertyId);
      await admin!.from('properties').delete().eq('id', propertyId);
    }
    // cleanup users
    for (const id of [tenant1Id, tenant2Id, landlordId]) {
      if (id) await admin!.auth.admin.deleteUser(id).catch(() => {});
    }
  });
});
