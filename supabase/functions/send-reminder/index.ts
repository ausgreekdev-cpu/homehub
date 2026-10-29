import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const today = new Date().toISOString().slice(0, 10);
    // flip overdue
    await supabase.from('expenses').update({ status: 'overdue' })
      .lt('due_date', today).in('status', ['pending', 'partial']);
    await supabase.from('expense_splits').update({ status: 'overdue' })
      .in('status', ['pending', 'partial'])
      .lt('created_at', new Date().toISOString()); // placeholder filter

    // notify unpaid splits
    const { data: splits } = await supabase.from('expense_splits').select('*, expenses(title, property_id)').eq('status', 'overdue');
    for (const s of splits ?? []) {
      await supabase.from('notifications').insert({
        user_id: s.user_id,
        type: 'overdue_bill',
        title: `Overdue: ${s.expenses?.title ?? 'Bill'}`,
        body: `You have an unpaid share. Please settle soon.`,
        link: `/properties/${s.expenses?.property_id}?tab=bills`,
      });
    }
    return new Response(JSON.stringify({ ok: true, notified: (splits ?? []).length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
