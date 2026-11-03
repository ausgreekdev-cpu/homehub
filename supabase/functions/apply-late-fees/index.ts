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

    const { data: overdueSplits } = await supabase
      .from('expense_splits')
      .select('*, expenses(property_id)')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())

    let applied = 0
    for (const split of overdueSplits || []) {
      const { data: rule } = await supabase
        .from('late_fee_rules')
        .select('*')
        .eq('property_id', split.expenses.property_id)
        .eq('enabled', true)
        .single()

      if (rule) {
        const daysOverdue = Math.floor((Date.now() - new Date(split.due_date).getTime()) / (1000 * 60 * 60 * 24))
        if (daysOverdue >= rule.grace_period_days) {
          const lateFee = Math.min(rule.late_fee_amount_cents, rule.max_late_fee_cents || rule.late_fee_amount_cents)
          await supabase.from('arrears').upsert({
            property_id: split.expenses.property_id,
            user_id: split.user_id,
            expense_split_id: split.id,
            amount_due_cents: split.share_cents,
            days_overdue: daysOverdue,
            late_fee_applied_cents: lateFee,
            status: 'open',
          })
          applied++
        }
      }
    }

    return new Response(JSON.stringify({ success: true, applied }), {
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
