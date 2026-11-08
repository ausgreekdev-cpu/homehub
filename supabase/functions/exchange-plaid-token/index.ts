import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { public_token, property_id, user_id, metadata } = await req.json()
    if (!public_token) throw new Error('public_token required')

    const clientId = Deno.env.get('PLAID_CLIENT_ID')
    const secret = Deno.env.get('PLAID_SECRET')
    const env = Deno.env.get('PLAID_ENV') || 'sandbox'
    const base = env === 'production' ? 'https://production.plaid.com' : env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // If Plaid not configured, keep dev stub behavior
    if (!clientId || !secret) {
      const { data, error } = await supabase.from('bank_accounts').insert({
        property_id,
        user_id,
        provider: 'plaid',
        plaid_access_token: 'access-sandbox-placeholder',
        institution_name: metadata?.institution?.name || 'Sandbox Bank',
        status: 'active',
        metadata: metadata || {},
      }).select().single()
      if (error) throw error
      return new Response(JSON.stringify({ success: true, data, mode: 'stub' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const ex = await fetch(`${base}/item/public_token/exchange`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, secret, public_token }),
    })
    const exData = await ex.json()
    if (!ex.ok) throw new Error(exData?.error_message || 'Plaid exchange failed')

    const { data, error } = await supabase.from('bank_accounts').insert({
      property_id,
      user_id,
      provider: 'plaid',
      plaid_item_id: exData.item_id,
      plaid_access_token: exData.access_token,
      institution_name: metadata?.institution?.name || null,
      institution_id: metadata?.institution?.institution_id || null,
      status: 'active',
      metadata: metadata || {},
    }).select().single()
    if (error) throw error

    return new Response(JSON.stringify({ success: true, data, mode: 'live' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
