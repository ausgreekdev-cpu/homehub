import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { adminSupabase, xeroExchangeCode, xeroGetConnections } from '@/lib/xero';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const stateRaw = searchParams.get('state');
  const error = searchParams.get('error');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  if (error) return NextResponse.redirect(`${appUrl}/reports?xero=error&msg=${encodeURIComponent(error)}`);
  if (!code || !stateRaw) return NextResponse.redirect(`${appUrl}/reports?xero=error&msg=missing_params`);
  try {
    const state = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== state.userId) return NextResponse.redirect(`${appUrl}/login?next=/reports`);

    const token = await xeroExchangeCode(code);
    const connections = await xeroGetConnections(token.access_token).catch(() => []);
    const tenant = connections[0];
    const admin = adminSupabase();
    await admin.from('xero_connections').upsert({
      user_id: user.id,
      property_id: state.propertyId || null,
      tenant_id: tenant?.tenantId || null,
      tenant_name: tenant?.tenantName || null,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      token_expires_at: new Date(Date.now() + (token.expires_in || 1800) * 1000).toISOString(),
      scopes: (token.scope || '').split(' ').filter(Boolean),
      status: 'active',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,property_id,tenant_id' });

    return NextResponse.redirect(`${appUrl}/reports?xero=connected`);
  } catch (e: any) {
    return NextResponse.redirect(`${appUrl}/reports?xero=error&msg=${encodeURIComponent(e?.message || 'callback_failed')}`);
  }
}
