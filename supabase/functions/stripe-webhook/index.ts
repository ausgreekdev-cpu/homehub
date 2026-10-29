import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');
    // In production, verify signature with STRIPE_WEBHOOK_SECRET.
    const event = JSON.parse(body);
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data?.object;
      const ref = pi?.id;
      await supabase.from('payments').update({ status: 'succeeded' }).eq('provider_ref', ref);
      // mark split paid
      const { data: pay } = await supabase.from('payments').select('split_id, amount_cents').eq('provider_ref', ref).single();
      if (pay?.split_id) {
        const { data: split } = await supabase.from('expense_splits').select('paid_cents, share_cents').eq('id', pay.split_id).single();
        const newPaid = (split?.paid_cents ?? 0) + (pay?.amount_cents ?? 0);
        await supabase.from('expense_splits').update({
          paid_cents: newPaid,
          status: newPaid >= (split?.share_cents ?? 0) ? 'paid' : 'partial',
          paid_at: newPaid >= (split?.share_cents ?? 0) ? new Date().toISOString() : null,
        }).eq('id', pay.split_id);
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
