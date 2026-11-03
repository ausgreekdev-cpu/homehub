import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''

    const { data: autopays } = await supabase
      .from('autopay_settings')
      .select('*, expense_splits(*, expenses(*))')
      .eq('enabled', true)

    let processed = 0
    for (const ap of autopays || []) {
      // Create payment intent for due splits
      const { data: splits } = await supabase
        .from('expense_splits')
        .select('*')
        .eq('user_id', ap.user_id)
        .eq('status', 'pending')

      for (const split of splits || []) {
        const res = await fetch('https://api.stripe.com/v1/payment_intents', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            amount: split.share_cents.toString(),
            currency: 'aud',
            'payment_method': ap.payment_method_id || '',
            confirm: 'true',
            'automatic_payment_methods[enabled]': 'true',
            'automatic_payment_methods[allow_redirects]': 'never',
          }),
        })
        const pi = await res.json()
        if (pi.id) {
          await supabase.from('expense_splits').update({ status: 'paid', paid_cents: split.share_cents }).eq('id', split.id)
          processed++
        }
      }
    }

    return new Response(JSON.stringify({ success: true, processed }), {
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
