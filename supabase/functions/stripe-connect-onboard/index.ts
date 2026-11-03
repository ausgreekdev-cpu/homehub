import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, propertyId } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY') ?? ''
    // Create Stripe Connect account (Express)
    const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        type: 'express',
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
      }),
    })
    const account = await accountRes.json()

    await supabase.from('stripe_accounts').upsert({
      user_id: userId,
      property_id: propertyId,
      stripe_account_id: account.id,
    })

    // Create account link
    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        account: account.id,
        refresh_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?connect=refresh`,
        return_url: `${Deno.env.get('SITE_URL') || 'http://localhost:3000'}/dashboard?connect=success`,
        type: 'account_onboarding',
      }),
    })
    const link = await linkRes.json()

    return new Response(JSON.stringify({ url: link.url, accountId: account.id }), {
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
