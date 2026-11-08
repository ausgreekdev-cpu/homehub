import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { propertyId, mode = 'csv' } = await req.json()
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '')

    if (mode === 'api') {
      // API sync is handled by the web app route /api/xero/sync (uses OAuth tokens stored in xero_connections).
      // This function remains available for CSV export and can act as a trigger point.
      return new Response(JSON.stringify({ success: false, error: 'Use /api/xero/sync for Xero API two-way sync. export-xero supports mode="csv".' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    const { data: expenses } = await supabase.from('expenses').select('*').eq('property_id', propertyId)
    const csv = [
      'Date,Description,AccountCode,Amount,Type,Reference',
      ...(expenses || []).map((e: any) => `${e.created_at?.split('T')[0] || ''},"${String(e.title || '').replace(/"/g, '""')}",${Deno.env.get('XERO_EXPENSE_ACCOUNT_CODE') || '400'},${(Number(e.amount_cents || 0) / 100).toFixed(2)},EXPENSE,homehub-expense-${e.id}`)
    ].join('\n')

    return new Response(JSON.stringify({ success: true, csv, mode: 'csv' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
  }
})
