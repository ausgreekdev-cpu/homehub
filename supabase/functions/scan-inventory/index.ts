import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { corsHeaders } from '../_shared/cors.ts';
import { INVENTORY_SCAN_PROMPT } from '../_shared/prompts.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  let scanId: string | undefined;
  try {
    const body = await req.json();
    scanId = body?.scanId;
    if (!scanId) throw new Error('scanId required');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: scan, error: scanErr } = await supabase
      .from('inventory_scans').select('*').eq('id', scanId).single();
    if (scanErr || !scan) throw new Error('scan not found');

    await supabase.from('inventory_scans').update({ status: 'processing' }).eq('id', scanId);

    const { data: signed } = await supabase.storage
      .from('inventory').createSignedUrl(scan.storage_path, 300);
    const imageUrl = signed?.signedUrl;
    if (!imageUrl) throw new Error('could not sign image url');

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: INVENTORY_SCAN_PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Scan this image and return the JSON.' },
          { type: 'image_url', image_url: { url: imageUrl, detail: 'high' } },
        ]},
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { parsed = { items: [], roomType: null, overallConfidence: 0 }; }

    await supabase.from('inventory_scans').update({
      status: 'done',
      detected_count: Array.isArray((parsed as any)?.items) ? (parsed as any).items.length : 0,
      result: parsed,
      completed_at: new Date().toISOString(),
    }).eq('id', scanId);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    try {
      if (scanId) {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL')!,
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        );
        await supabase.from('inventory_scans').update({
          status: 'failed',
          result: { error: String(e) },
        }).eq('id', scanId);
      }
    } catch (_) { /* ignore */ }
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
