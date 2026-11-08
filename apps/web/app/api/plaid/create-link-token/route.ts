import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const clientId = process.env.PLAID_CLIENT_ID;
    const secret = process.env.PLAID_SECRET;
    const env = process.env.PLAID_ENV || 'sandbox';
    const base = env === 'production' ? 'https://production.plaid.com' : env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com';

    if (!clientId || !secret) {
      return NextResponse.json({ link_token: 'link-sandbox-' + Math.random().toString(36).slice(2, 11), mode: 'stub' });
    }

    const resp = await fetch(`${base}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        secret,
        user: { client_user_id: user.id },
        client_name: 'HomeHub',
        products: ['auth', 'transactions'],
        country_codes: ['AU', 'US'],
        language: 'en',
        webhook: process.env.PLAID_WEBHOOK_URL || undefined,
      }),
    });
    const data = await resp.json();
    if (!resp.ok) return NextResponse.json({ error: data?.error_message || 'Plaid error' }, { status: 500 });

    return NextResponse.json({ link_token: data.link_token, mode: 'live' });
  } catch (error: any) {
    console.error('Plaid create-link-token error', error);
    return NextResponse.json({ error: 'Failed to create link token' }, { status: 500 });
  }
}
