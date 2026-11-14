import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { global: { headers: authHeader ? { Authorization: authHeader } : {} } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { billId, amountCents } = await req.json()
    if (!billId || !amountCents || amountCents < 1) throw new Error('billId and amountCents required')

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    // Verify the bill exists and belongs to the user
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: bill } = await admin.from('bills').select('id, total_amount, status').eq('id', billId).maybeSingle()
    if (!bill) throw new Error('Bill not found')

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: String(Math.round(amountCents)),
        currency: 'aud',
        'metadata[bill_id]': billId,
        'metadata[user_id]': user.id,
        'automatic_payment_methods[enabled]': 'true',
      }),
    })
    const pi = await res.json()
    if (!res.ok) throw new Error(pi?.error?.message || 'Stripe PaymentIntent creation failed')

    return new Response(JSON.stringify({ clientSecret: pi.client_secret, paymentIntentId: pi.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
