import Stripe from 'npm:stripe@17'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', { apiVersion: '2024-06-20' })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const body = await req.text()
    const sig = req.headers.get('stripe-signature')
    const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
    let event: any

    if (secret && sig) {
      event = await stripe.webhooks.constructEventAsync(body, sig, secret)
    } else if (Deno.env.get('ALLOW_INSECURE_WEBHOOKS') === 'true') {
      event = JSON.parse(body)
    } else {
      return new Response(JSON.stringify({ error: 'Webhook signature verification required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // Idempotency
    if (event.id) {
      try {
        const { data: seen } = await supabase.from('integration_events').select('id').eq('provider', 'stripe').eq('event_id', event.id).maybeSingle()
        if (seen) return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      } catch {}
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data?.object
      const ref = pi?.id
      if (ref) {
        await supabase.from('payments').update({ status: 'succeeded' }).eq('provider_ref', ref)
        const { data: pay } = await supabase.from('payments').select('split_id, amount_cents').eq('provider_ref', ref).maybeSingle()
        if (pay?.split_id) {
          const { data: split } = await supabase.from('expense_splits').select('paid_cents, share_cents').eq('id', pay.split_id).maybeSingle()
          const newPaid = (split?.paid_cents ?? 0) + (pay?.amount_cents ?? 0)
          await supabase.from('expense_splits').update({
            paid_cents: newPaid,
            status: newPaid >= (split?.share_cents ?? 0) ? 'paid' : 'partial',
            paid_at: newPaid >= (split?.share_cents ?? 0) ? new Date().toISOString() : null,
          }).eq('id', pay.split_id)
        }
      }
    }

    if (event.type === 'payment_intent.payment_failed') {
      const pi = event.data?.object
      if (pi?.id) await supabase.from('payments').update({ status: 'failed' }).eq('provider_ref', pi.id)
    }

    if (event.id) {
      try { await supabase.from('integration_events').insert({ provider: 'stripe', event_id: event.id, event_type: event.type, object_id: (event.data?.object as any)?.id || null, payload: event }) } catch {}
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
