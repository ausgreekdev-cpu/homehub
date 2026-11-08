import { createClient } from '@supabase/supabase-js';

const XERO_AUTH = 'https://login.xero.com/identity/connect/authorize';
const XERO_TOKEN = 'https://identity.xero.com/connect/token';
const XERO_API = 'https://api.xero.com/api.xro/2.0';
const XERO_CONNECTIONS = 'https://api.xero.com/connections';

export function xeroConfig() {
  const clientId = process.env.XERO_CLIENT_ID;
  const clientSecret = process.env.XERO_CLIENT_SECRET;
  const redirectUri = process.env.XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`;
  const scopes = process.env.XERO_SCOPES || 'openid profile email accounting.transactions accounting.contacts accounting.settings offline_access';
  return { clientId, clientSecret, redirectUri, scopes, configured: !!(clientId && clientSecret) };
}

export function xeroConnectUrl(state: string) {
  const { clientId, redirectUri, scopes } = xeroConfig();
  const u = new URL(XERO_AUTH);
  u.searchParams.set('response_type', 'code');
  u.searchParams.set('client_id', clientId!);
  u.searchParams.set('redirect_uri', redirectUri);
  u.searchParams.set('scope', scopes);
  u.searchParams.set('state', state);
  return u.toString();
}

export async function xeroExchangeCode(code: string) {
  const { clientId, clientSecret, redirectUri } = xeroConfig();
  const body = new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  const res = await fetch(XERO_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64') },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || 'Xero token exchange failed');
  return data;
}

export async function xeroRefresh(refreshToken: string) {
  const { clientId, clientSecret } = xeroConfig();
  const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken });
  const res = await fetch(XERO_TOKEN, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64') },
    body,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error_description || data?.error || 'Xero refresh failed');
  return data;
}

export async function xeroGetConnections(accessToken: string) {
  const res = await fetch(XERO_CONNECTIONS, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' } });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.Detail || 'Failed to get Xero connections');
  return data as Array<{ tenantId: string; tenantName: string }>;
}

export async function xeroApi(accessToken: string, tenantId: string, path: string, init?: RequestInit) {
  const res = await fetch(`${XERO_API}${path}`, {
    ...init,
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Xero-tenant-id': tenantId, 'Accept': 'application/json', 'Content-Type': 'application/json', ...(init?.headers as any) },
  });
  const text = await res.text();
  let data: any = null; try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(data?.Message || data?.Detail || data?.Title || `Xero API error ${res.status}`);
  return data;
}

export function adminSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function getValidXeroConnection(connectionId: string) {
  const admin = adminSupabase();
  const { data: conn, error } = await admin.from('xero_connections').select('*').eq('id', connectionId).single();
  if (error || !conn) throw new Error('Xero connection not found');
  const expires = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
  if (expires && expires - Date.now() > 60_000) return { conn, admin };
  if (!conn.refresh_token) throw new Error('Xero token expired and no refresh token');
  const refreshed = await xeroRefresh(conn.refresh_token);
  const patch = {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token || conn.refresh_token,
    token_expires_at: new Date(Date.now() + (refreshed.expires_in || 1800) * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  await admin.from('xero_connections').update(patch).eq('id', conn.id);
  return { conn: { ...conn, ...patch }, admin };
}
