import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { global: { headers: authHeader ? { Authorization: authHeader } : {} } })
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { applicationId, provider = 'smartmove' } = await req.json()
    if (!applicationId) throw new Error('applicationId required')

    const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    // Load application + verify landlord/agent access
    const { data: app } = await admin.from('applications').select('id, listing_id, first_name, last_name, email, phone').eq('id', applicationId).maybeSingle()
    if (!app) throw new Error('Application not found')
    const { data: listing } = await admin.from('listings').select('property_id').eq('id', app.listing_id).maybeSingle()
    if (listing?.property_id) {
      const { data: mem } = await admin.from('property_memberships').select('role').eq('property_id', listing.property_id).eq('user_id', user.id).maybeSingle()
      if (!mem || !['landlord', 'agent'].includes(mem.role)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Real provider integration (generic/adapter): configure SCREENING_PROVIDER=generic + SCREENING_API_URL + SCREENING_API_KEY
    const apiUrl = Deno.env.get('SCREENING_API_URL')
    const apiKey = Deno.env.get('SCREENING_API_KEY')
    let reportId: string | null = null
    let status = 'pending'
    let result: any = {}

    if (apiUrl && apiKey) {
      const resp = await fetch(apiUrl.replace(/\/$/, '') + '/screenings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          provider,
          application_id: applicationId,
          applicant: { first_name: app.first_name, last_name: app.last_name, email: app.email, phone: app.phone },
          callback_url: Deno.env.get('SCREENING_WEBHOOK_URL') || undefined,
        }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error?.message || data?.message || 'Screening provider error')
      reportId = data.report_id || data.id || null
      status = data.status || 'pending'
      result = data
    } else if (Deno.env.get('SCREENING_PROVIDER') === 'transunion_smartmove') {
      // TransUnion SmartMove typically requires partner onboarding and specific API credentials/flow.
      // Keep a clear operational path when credentials/partner setup is not yet configured.
      status = 'pending_setup'
      result = { message: 'TransUnion SmartMove integration requires partner API credentials. Set SCREENING_API_URL/SCREENING_API_KEY or complete partner setup.' }
      reportId = `sm_pending_${crypto.randomUUID().slice(0, 8)}`
    } else {
      status = 'stub'
      reportId = `rpt_${crypto.randomUUID().slice(0, 8)}`
      result = { message: 'Screening stub: configure SCREENING_API_URL/SCREENING_API_KEY for live screening.' }
    }

    const { data, error } = await admin.from('screenings').insert({
      application_id: applicationId,
      provider,
      status,
      report_id: reportId,
      result,
    }).select().single()
    if (error) throw error

    return new Response(JSON.stringify({ success: true, screening: data, live: !!(apiUrl && apiKey) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
