import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { userId } = await req.json();
    if (!userId) throw new Error('userId required');
    const env = Deno.env.get('PLAID_ENV') ?? 'sandbox';
    const base = env === 'production' ? 'https://production.plaid.com' : env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com';

    const res = await fetch(`${base}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: Deno.env.get('PLAID_CLIENT_ID'),
        secret: Deno.env.get('PLAID_SECRET'),
        client_name: 'HomeHub',
        user: { client_user_id: userId },
        products: ['auth', 'transactions'],
        country_codes: ['AU', 'US'],
        language: 'en',
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error_message ?? 'plaid error');
    return new Response(JSON.stringify({ linkToken: data.link_token, expiration: data.expiration }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
