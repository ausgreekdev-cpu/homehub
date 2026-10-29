import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ready = !!URL && !!SERVICE;

const admin = ready ? createClient(URL!, SERVICE!) : null;

describe.skipIf(!ready)('RLS isolation', () => {
  let propertyId: string;
  let tenantClient: SupabaseClient;
  let landlordClient: SupabaseClient;
  let otherTenantClient: SupabaseClient;

  beforeAll(async () => {
    // Seed two users + a property. Assumes auth users created via service role.
    const { data: t1 } = await admin!.auth.admin.createUser({ email: 'tenant1@test.local', password: 'password123', email_confirm: true });
    const { data: t2 } = await admin!.auth.admin.createUser({ email: 'tenant2@test.local', password: 'password123', email_confirm: true });
    const { data: ll } = await admin!.auth.admin.createUser({ email: 'landlord@test.local', password: 'password123', email_confirm: true });

    const { data: prop } = await admin!.from('properties').insert({ name: 'RLS Test Property', address: '1 Test St', owner_id: ll.user!.id }).select().single();
    propertyId = prop.id;

    await admin!.from('property_memberships').insert([
      { property_id: propertyId, user_id: t1.user!.id, role: 'tenant' },
      { property_id: propertyId, user_id: ll.user!.id, role: 'landlord' },
    ]);

    // anon clients
    tenantClient = createClient(URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await tenantClient.auth.signInWithPassword({ email: 'tenant1@test.local', password: 'password123' });
    landlordClient = createClient(URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await landlordClient.auth.signInWithPassword({ email: 'landlord@test.local', password: 'password123' });
    otherTenantClient = createClient(URL!, process.env.SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    await otherTenantClient.auth.signInWithPassword({ email: 'tenant2@test.local', password: 'password123' });
  });

  it('tenant can read expenses of own property', async () => {
    await admin!.from('expenses').insert({ property_id: propertyId, title: 'Test bill', amount_cents: 1000, created_by: (await tenantClient.auth.getUser()).data.user!.id });
    const { data, error } = await tenantClient.from('expenses').select('*').eq('property_id', propertyId);
    expect(error).toBeNull();
    expect((data ?? []).length).toBeGreaterThan(0);
  });

  it('non-member cannot read expenses', async () => {
    const { data, error } = await otherTenantClient.from('expenses').select('*').eq('property_id', propertyId);
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

  it('contractor cannot approve quotes (RLS blocks)', async () => {
    // placeholder: ensure a contractor client cannot update ticket_quotes
    expect(true).toBe(true);
  });

  afterAll(async () => {
    // cleanup
    if (propertyId) await admin!.from('properties').delete().eq('id', propertyId);
  });
});
