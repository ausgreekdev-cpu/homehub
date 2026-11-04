import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyId, ownerId, month } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('property_id', propertyId)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + e.amount_cents, 0)
    const rentCollected = 0 // simplified
    const net = rentCollected - totalExpenses

    return new Response(JSON.stringify({ 
      success: true, 
      statement: {
        propertyId,
        ownerId,
        month,
        rentCollected,
        totalExpenses,
        net,
        expenses: expenses?.length || 0
      }
    }), {
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
