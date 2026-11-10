import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

  const checks: Record<string, unknown> = {
    service: 'homehub-web',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseAnonKey: !!supabaseAnonKey,
    },
  };

  // Optional lightweight check: only when explicitly requested to avoid latency/cost
  const url = new URL(request.url);
  if (url.searchParams.get('deep') === '1' && supabaseUrl) {
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: supabaseAnonKey
          ? { apikey: supabaseAnonKey }
          : undefined,
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      });
      checks.supabase = { ok: res.ok, status: res.status };
    } catch (e: any) {
      checks.supabase = { ok: false, error: e?.message || 'unreachable' };
    }
  }

  return NextResponse.json({ ok: true, ...checks }, {
    headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
  });
}
