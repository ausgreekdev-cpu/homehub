import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { xeroConfig, xeroConnectUrl } from '@/lib/xero';

export async function GET(req: Request) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL('/login', req.url));
  if (!xeroConfig().configured) return NextResponse.json({ error: 'XERO_CLIENT_ID/XERO_CLIENT_SECRET not configured' }, { status: 400 });
  const { searchParams } = new URL(req.url);
  const propertyId = searchParams.get('propertyId') || '';
  const state = Buffer.from(JSON.stringify({ userId: user.id, propertyId, ts: Date.now() })).toString('base64url');
  return NextResponse.redirect(xeroConnectUrl(state));
}
