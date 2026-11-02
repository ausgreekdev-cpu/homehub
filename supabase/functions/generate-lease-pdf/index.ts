import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { leaseId } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: lease } = await supabase
      .from('leases')
      .select('*, properties(*), profiles(*)')
      .eq('id', leaseId)
      .single()

    // In production, generate PDF with pdf-lib
    const pdfContent = `LEASE AGREEMENT\n\nProperty: ${lease?.properties?.name}\nTenant: ...\nStart: ${lease?.start_date}\nEnd: ${lease?.end_date}\nRent: $${(lease?.rent_cents || 0) / 100}/month`

    return new Response(JSON.stringify({ success: true, pdf: btoa(pdfContent) }), {
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
