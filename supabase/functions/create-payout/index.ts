import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { global: { headers: authHeader ? { Authorization: authHeader } : {} } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { propertyId, stripeAccountId, amountCents, currency = 'aud', description, metadata } = await req.json()
    if (!amountCents || amountCents < 1) throw new Error('amountCents required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    let destination = stripeAccountId
    if (!destination && propertyId) {
      const { data: acct } = await admin.from('stripe_accounts').select('stripe_account_id, charges_enabled, payouts_enabled').eq('property_id', propertyId).maybeSingle()
      destination = acct?.stripe_account_id
      if (!acct?.payouts_enabled) {
        // allow attempt but warn via metadata; Stripe may still accept depending on state
      }
    }
    if (!destination) throw new Error('No Stripe connected account found')

    // Authz: must be landlord/agent for property if propertyId provided
    if (propertyId) {
      const { data: membership } = await admin.from('property_memberships').select('role').eq('property_id', propertyId).eq('user_id', user.id).maybeSingle()
      if (!membership || !['landlord', 'agent'].includes(membership.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const params = new URLSearchParams({
      amount: String(Math.round(amountCents)),
      currency,
      destination,
    })
    if (description) params.set('description', description)
    if (propertyId) params.set('metadata[property_id]', propertyId)
    if (metadata && typeof metadata === 'object') {
      for (const [k, v] of Object.entries(metadata)) params.set(`metadata[${k}]`, String(v))
    }

    const res = await fetch('https://api.stripe.com/v1/transfers', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    })
    const transfer = await res.json()
    if (!res.ok) throw new Error(transfer?.error?.message || 'Stripe transfer failed')

    await admin.from('payouts').insert({
      stripe_account_id: destination,
      stripe_payout_id: transfer.id,
      amount_cents: Math.round(amountCents),
      currency,
      status: 'pending', // transfer created; destination payout/availability varies
    })

    return new Response(JSON.stringify({ success: true, transfer }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
