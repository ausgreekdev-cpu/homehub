import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  const checks: Record<string, unknown> = {
    service: 'homehub-web',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  };

  // Optional lightweight check: only when explicitly requested to avoid latency/cost
  const url = new URL(request.url);
  if (url.searchParams.get('deep') === '1' && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
        headers: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          ? { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY }
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
