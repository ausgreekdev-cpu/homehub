import Stripe from 'npm:stripe@17'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-06-20' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const secret = Deno.env.get('STRIPE_CONNECT_WEBHOOK_SECRET') || Deno.env.get('STRIPE_WEBHOOK_SECRET')
    let event: Stripe.Event

    if (secret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, secret)
    } else if (Deno.env.get('ALLOW_INSECURE_WEBHOOKS') === 'true') {
      event = JSON.parse(body)
    } else {
      return new Response(JSON.stringify({ error: 'Missing webhook signature configuration' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Idempotency
    if (event.id) {
      try {
        const { data: seen } = await admin.from('integration_events').select('id').eq('provider', 'stripe_connect').eq('event_id', event.id).maybeSingle()
        if (seen) return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } catch {}
    }

    if (event.type === 'account.updated') {
      const account = event.data.object as Stripe.Account
      await admin.from('stripe_accounts').update({
        onboarding_complete: !!account.details_submitted,
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
        updated_at: new Date().toISOString(),
      }).eq('stripe_account_id', account.id)
    }

    if (event.type === 'payout.paid' || event.type === 'payout.failed' || event.type === 'transfer.created' || event.type === 'transfer.updated') {
      const obj = event.data.object as any
      if (obj?.id) {
        await admin.from('payouts').update({ status: obj.status || event.type }).eq('stripe_payout_id', obj.id)
      }
    }

    if (event.id) {
      try { await admin.from('integration_events').insert({ provider: 'stripe_connect', event_id: event.id, event_type: event.type, object_id: (event.data.object as any)?.id || null, payload: event as any }) } catch {}
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    console.error('stripe-connect-webhook error', error)
    return new Response(JSON.stringify({ error: error.message || String(error) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
