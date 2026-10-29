import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { corsHeaders } from '../_shared/cors.ts';

const PROMPT = `You are a property maintenance triage assistant. Analyze the image/video description of a repair issue and return ONLY JSON: {"severity":"emergency"|"urgent"|"routine"|"cosmetic","tradeCategory":"plumbing"|"electrical"|"hvac"|"carpentry"|"painting"|"cleaning"|"pest_control"|"locksmith"|"appliance"|"general"|"other","costMinCents":number,"costMaxCents":number,"safetyFlags":[string],"summary":string}. Emergency = safety risk or major water/gas/electrical hazard. No prose.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { ticketId, imageUrl } = await req.json();
    if (!ticketId) throw new Error('ticketId required');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
    const userContent: any[] = [{ type: 'text', text: 'Diagnose this maintenance issue.' }];
    if (imageUrl) userContent.push({ type: 'image_url', image_url: { url: imageUrl, detail: 'high' } });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);

    const priorityMap: Record<string, string> = { emergency: 'emergency', urgent: 'urgent', routine: 'routine', cosmetic: 'cosmetic' };
    await supabase.from('maintenance_tickets').update({
      ai_severity: parsed.severity,
      ai_trade_suggestion: parsed.tradeCategory,
      ai_cost_min_cents: parsed.costMinCents,
      ai_cost_max_cents: parsed.costMaxCents,
      ai_raw: parsed,
      priority: priorityMap[parsed.severity] ?? 'routine',
      category: parsed.tradeCategory ?? 'general',
    }).eq('id', ticketId);

    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
