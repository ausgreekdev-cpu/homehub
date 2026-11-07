import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { propertyId, startDate, endDate } = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const start = startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const end = endDate || new Date().toISOString().split('T')[0]

    // Income: paid expense splits
    const { data: expenses } = await supabase
      .from('expenses')
      .select('*')
      .eq('property_id', propertyId)
      .gte('created_at', start)
      .lte('created_at', end)

    const { data: splits } = await supabase
      .from('expense_splits')
      .select('*')

    const expenseIds = (expenses || []).map(e => e.id)
    const relevantSplits = (splits || []).filter(s => expenseIds.includes(s.expense_id))

    const income = relevantSplits
      .filter(s => s.status === 'paid')
      .reduce((sum, s) => sum + (s.paid_cents || s.share_cents || 0), 0)

    const totalExpenses = (expenses || []).reduce((sum, e) => sum + (e.amount_cents || 0), 0)

    // Group expenses by category (using title as proxy)
    const byCategory: Record<string, number> = {}
    for (const e of expenses || []) {
      const cat = e.category || 'Other'
      byCategory[cat] = (byCategory[cat] || 0) + (e.amount_cents || 0)
    }

    const noi = income - totalExpenses

    return new Response(JSON.stringify({
      success: true,
      report: {
        propertyId,
        period: { start, end },
        income,
        totalExpenses,
        netOperatingIncome: noi,
        byCategory,
        expenseCount: (expenses || []).length,
        paidSplitCount: relevantSplits.filter(s => s.status === 'paid').length,
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
