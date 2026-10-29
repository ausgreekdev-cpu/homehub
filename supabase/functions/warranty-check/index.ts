import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const today = new Date();
    const in30 = new Date(today.getTime() + 30 * 86400000).toISOString().slice(0, 10);
    const { data: items } = await supabase.from('inventory_items').select('id,name,property_id,warranty_expiry,created_by').lte('warranty_expiry', in30).gte('warranty_expiry', today.toISOString().slice(0, 10));
    let notified = 0;
    for (const it of items ?? []) {
      // notify property members (owners/landlords/agents) — here notify creator
      if (it.created_by) {
        await supabase.from('notifications').insert({
          user_id: it.created_by,
          type: 'warranty_expiring',
          title: `Warranty expiring: ${it.name}`,
          body: `Warranty expires ${it.warranty_expiry}.`,
          link: `/properties/${it.property_id}?tab=inventory`,
        });
        notified++;
      }
    }
    return new Response(JSON.stringify({ ok: true, checked: (items ?? []).length, notified }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
