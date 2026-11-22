import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL). ' +
        'Set it in your environment (see docs/deploy.md).',
    );
  }
  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_PUBLISHABLE_KEY). ' +
        'Set it in your environment (see docs/deploy.md).',
    );
  }
  return createBrowserClient(url, key);
}
