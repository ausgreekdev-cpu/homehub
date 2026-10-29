import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { corsHeaders } from '../_shared/cors.ts';

const PROMPT = `You are a property condition assessor. You receive move-in and move-out photos for the same areas. For each area/item, decide whether the change is "wear_and_tear" (normal aging), "damage" (beyond normal wear, tenant-liable), or "ok" (no meaningful change). Return ONLY JSON: {"items":[{"area":string,"item":string,"flag":"wear_and_tear"|"damage"|"ok","reason":string}]}. No prose.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { moveInReportId, moveOutReportId } = await req.json();
    if (!moveInReportId || !moveOutReportId) throw new Error('both report ids required');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: inReport } = await supabase.from('condition_reports').select('*, condition_report_items(*)').eq('id', moveInReportId).single();
    const { data: outReport } = await supabase.from('condition_reports').select('*, condition_report_items(*)').eq('id', moveOutReportId).single();
    if (!inReport || !outReport) throw new Error('report not found');

    // collect photo urls
    const inItems = inReport.condition_report_items ?? [];
    const outItems = outReport.condition_report_items ?? [];
    const content: any[] = [{ type: 'text', text: `Move-in items: ${JSON.stringify(inItems.map((i:any)=>({area:i.area,item:i.item,condition:i.condition,notes:i.notes})))}. Move-out items: ${JSON.stringify(outItems.map((i:any)=>({area:i.area,item:i.item,condition:i.condition,notes:i.notes})))}. Compare and return flags.` }];

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: PROMPT }, { role: 'user', content }],
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    // write flags back to move-out report items
    const flags = parsed.items ?? [];
    for (const f of flags) {
      await supabase.from('condition_report_items').update({ ai_flag: f.flag })
        .eq('report_id', moveOutReportId).eq('area', f.area).eq('item', f.item);
    }
    await supabase.from('condition_reports').update({ ai_summary: parsed }).eq('id', moveOutReportId);

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
