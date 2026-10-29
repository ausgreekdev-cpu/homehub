import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai@4';
import { corsHeaders } from '../_shared/cors.ts';

const PROMPT = `You are a bill parser. Extract from the document: vendor, total amount in cents (AUD), due date (ISO YYYY-MM-DD), account number, and line items [{description, amountCents}]. Return ONLY JSON: {"vendor":string|null,"totalCents":number,"dueDate":string|null,"accountNumber":string|null,"lineItems":[{"description":string,"amountCents":number}]}. No prose.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { expenseId } = await req.json();
    if (!expenseId) throw new Error('expenseId required');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { data: exp } = await supabase.from('expenses').select('*').eq('id', expenseId).single();
    if (!exp?.receipt_storage_path) throw new Error('no receipt attached');
    const { data: signed } = await supabase.storage.from('receipts').createSignedUrl(exp.receipt_storage_path, 300);
    if (!signed?.signedUrl) throw new Error('could not sign receipt url');

    const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY')! });
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: PROMPT },
        { role: 'user', content: [
          { type: 'text', text: 'Parse this bill.' },
          { type: 'image_url', image_url: { url: signed.signedUrl, detail: 'high' } },
        ]},
      ],
      temperature: 0,
    });
    const raw = completion.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    await supabase.from('expenses').update({
      parsed_total_cents: parsed.totalCents ?? null,
      parsed_due_date: parsed.dueDate ?? null,
      parsed_line_items: parsed.lineItems ?? null,
      amount_cents: parsed.totalCents ?? exp.amount_cents,
      due_date: parsed.dueDate ?? exp.due_date,
    }).eq('id', expenseId);
    return new Response(JSON.stringify(parsed), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
