import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')

    const { data: autopays } = await supabase.from('autopay_settings').select('*').eq('enabled', true)
    let processed = 0
    let failed = 0
    const details: any[] = []

    for (const ap of autopays || []) {
      if (!ap.payment_method_id) { failed++; details.push({ user_id: ap.user_id, error: 'missing_payment_method' }); continue }
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('id, share_cents, paid_cents, expense_id')
        .eq('user_id', ap.user_id)
        .in('status', ['pending', 'partial'])

      for (const split of splits || []) {
        const due = Math.max(0, (split.share_cents || 0) - (split.paid_cents || 0))
        if (due < 1) continue
        const idemKey = `autopay:${ap.id}:${split.id}:${new Date().toISOString().slice(0, 10)}`
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': idemKey },
          body: new URLSearchParams({
            amount: String(due),
            currency: (Deno.env.get('DEFAULT_CURRENCY') || 'aud').toLowerCase(),
            payment_method: ap.payment_method_id,
            confirm: 'true',
            off_session: 'true',
            'metadata[source]': 'autopay',
            'metadata[split_id]': split.id,
            'metadata[user_id]': ap.user_id,
            'metadata[autopay_id]': ap.id,
          }),
        })
        const pi = await res.json()
        if (res.ok && (pi.status === 'succeeded' || pi.status === 'processing')) {
          await supabase.from('payments').insert({ split_id: split.id, amount_cents: due, provider: 'stripe', provider_ref: pi.id, status: pi.status === 'succeeded' ? 'succeeded' : 'pending' })
          if (pi.status === 'succeeded') {
            await supabase.from('expense_splits').update({ status: 'paid', paid_cents: split.share_cents, paid_at: new Date().toISOString() }).eq('id', split.id)
          }
          processed++
          details.push({ split_id: split.id, payment_intent: pi.id, status: pi.status })
        } else {
          failed++
          details.push({ split_id: split.id, error: pi?.error?.message || pi?.last_payment_error?.message || 'payment_failed' })
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed, failed, details }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
