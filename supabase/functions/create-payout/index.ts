import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { stripeAccountId, amountCents } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

    const res = await fetch('https://api.stripe.com/v1/transfers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amountCents.toString(),
        currency: 'aud',
        destination: stripeAccountId,
      }),
    })
    const transfer = await res.json()

    await supabase.from('payouts').insert({
      stripe_account_id: stripeAccountId,
      stripe_payout_id: transfer.id,
      amount_cents: amountCents,
      status: transfer.status || 'pending',
    })

    return new Response(JSON.stringify({ success: true, transfer }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
