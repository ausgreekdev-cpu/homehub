import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'https://esm.sh/stripe@17?target=deno';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { splitId } = await req.json();
    if (!splitId) throw new Error('splitId required');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: split, error: splitErr } = await supabase
      .from('expense_splits').select('*, expenses(title, property_id, currency)').eq('id', splitId).single();
    if (splitErr || !split) throw new Error('split not found');

    const remaining = split.share_cents - (split.paid_cents ?? 0);
    if (remaining <= 0) throw new Error('already paid');

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const intent = await stripe.paymentIntents.create({
      amount: remaining,
      currency: (split.expenses?.currency ?? 'aud').toLowerCase(),
      metadata: { splitId, expenseId: split.expense_id, propertyId: split.expenses?.property_id ?? '' },
      description: `HomeHub: ${split.expenses?.title ?? 'Bill'} share`,
    });

    await supabase.from('payments').insert({
      expense_id: split.expense_id,
      split_id: splitId,
      payer_id: split.user_id,
      amount_cents: remaining,
      currency: split.expenses?.currency ?? 'AUD',
      provider: 'stripe',
      provider_ref: intent.id,
      status: 'pending',
    });

    return new Response(JSON.stringify({ clientSecret: intent.client_secret, paymentIntentId: intent.id, amountCents: remaining }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
