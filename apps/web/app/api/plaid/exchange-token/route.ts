import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { public_token, propertyId, metadata } = await req.json();
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!public_token) return NextResponse.json({ error: 'public_token required' }, { status: 400 });

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const env = process.env.PLAID_ENV || 'sandbox';
    const base = env === 'production' ? 'https://production.plaid.com' : env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com';

    if (!clientId || !secret) {
      return NextResponse.json({ success: true, mode: 'stub' });
    }

    const ex = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token }),
    });
    const exData = await ex.json();
    if (!ex.ok) return NextResponse.json({ error: exData?.error_message || 'Plaid exchange failed' }, { status: 500 });

    const { error } = await supabase.from('bank_accounts').insert({
      property_id: propertyId || null,
      user_id: user.id,
      provider: 'plaid',
      plaid_item_id: exData.item_id,
      plaid_access_token: exData.access_token,
      institution_name: metadata?.institution?.name || null,
      institution_id: metadata?.institution?.institution_id || null,
      status: 'active',
      metadata: metadata || {},
    });
    if (error) throw error;

    return NextResponse.json({ success: true, mode: 'live' });
  } catch (error: any) {
    console.error('Plaid exchange error', error);
    return NextResponse.json({ error: 'Failed to exchange token' }, { status: 500 });
  }
}
