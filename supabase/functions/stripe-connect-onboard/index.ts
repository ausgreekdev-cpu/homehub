import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: authHeader ? { Authorization: authHeader } : {} } }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { propertyId, email, country = 'AU' } = await req.json()
    if (!propertyId) throw new Error('propertyId required')

    // Verify landlord/agent membership
    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')
    const { data: membership } = await admin.from('property_memberships').select('role').eq('property_id', propertyId).eq('user_id', user.id).maybeSingle()
    if (!membership || !['landlord', 'agent'].includes(membership.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY not configured')
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000'

    // Reuse existing account if present
    const { data: existing } = await admin.from('stripe_accounts').select('*').eq('property_id', propertyId).eq('user_id', user.id).maybeSingle()
    let accountId = existing?.stripe_account_id

    if (!accountId) {
      const params = new URLSearchParams({
        type: 'express',
        country,
        'capabilities[card_payments][requested]': 'true',
        'capabilities[transfers][requested]': 'true',
        'metadata[property_id]': propertyId,
        'metadata[user_id]': user.id,
      })
      if (email || user.email) params.set('email', email || user.email!)

      const accountRes = await fetch('https://api.stripe.com/v1/accounts', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      })
      const account = await accountRes.json()
      if (!accountRes.ok) throw new Error(account?.error?.message || 'Failed to create Stripe account')
      accountId = account.id

      await admin.from('stripe_accounts').upsert({
        user_id: user.id,
        property_id: propertyId,
        stripe_account_id: accountId,
        onboarding_complete: !!account.details_submitted,
        charges_enabled: !!account.charges_enabled,
        payouts_enabled: !!account.payouts_enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'stripe_account_id' })
    }

    const linkRes = await fetch('https://api.stripe.com/v1/account_links', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${stripeKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        account: accountId,
        refresh_url: `${siteUrl}/connect-stripe?propertyId=${encodeURIComponent(propertyId)}&status=refresh`,
        return_url: `${siteUrl}/connect-stripe?propertyId=${encodeURIComponent(propertyId)}&status=success`,
        type: 'account_onboarding',
      }),
    })
    const link = await linkRes.json()
    if (!linkRes.ok) throw new Error(link?.error?.message || 'Failed to create account link')

    return new Response(JSON.stringify({ url: link.url, accountId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
