import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PDFDocument, StandardFonts, rgb } from 'https://esm.sh/pdf-lib@1.17.1';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { propertyId } = await req.json();
    if (!propertyId) throw new Error('propertyId required');
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: property } = await supabase.from('properties').select('name,address').eq('id', propertyId).single();
    const { data: items } = await supabase.from('inventory_items').select('*').eq('property_id', propertyId).is('deleted_at', null);

    const doc = await PDFDocument.create();
    const page = doc.addPage([595, 842]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    let y = 800;
    const draw = (text: string, x: number, size = 10, f = font) => {
      page.drawText(text, { x, y, size, font: f, color: rgb(0, 0, 0) });
    };

    draw('HomeHub — Insurance Claim Inventory', 50, 16, bold);
    y -= 20;
    draw(`Property: ${property?.name ?? ''}`, 50, 11, bold);
    y -= 14;
    draw(`Address: ${property?.address ?? ''}`, 50, 10);
    y -= 14;
    draw(`Generated: ${new Date().toISOString().slice(0, 10)}`, 50, 10);
    y -= 20;

    // header row
    const headers = ['Item', 'Category', 'Condition', 'Replacement (AUD)'];
    const xs = [50, 260, 360, 470];
    headers.forEach((h, i) => draw(h, xs[i], 10, bold));
    y -= 14;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });
    y -= 12;

    let total = 0;
    for (const it of items ?? []) {
      if (y < 60) { /* new page */ const np = doc.addPage([595, 842]); /* reset not tracked; keep simple */ }
      const name = (it.name ?? '').slice(0, 38);
      draw(name, xs[0], 9);
      draw(String(it.category ?? ''), xs[1], 9);
      draw(String(it.condition ?? ''), xs[2], 9);
      const val = (it.replacement_value_cents ?? 0) / 100;
      draw(val.toFixed(2), xs[3], 9);
      total += it.replacement_value_cents ?? 0;
      y -= 12;
      if (it.serial_number) { draw(`   SN: ${it.serial_number}`, 50, 8); y -= 10; }
      if (it.model_number) { draw(`   Model: ${it.model_number}`, 50, 8); y -= 10; }
    }

    y -= 8;
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1 });
    y -= 14;
    draw(`Total replacement value: ${(total / 100).toFixed(2)} AUD`, 50, 11, bold);
    y -= 14;
    draw(`Items: ${(items ?? []).length}`, 50, 10);

    const pdfBytes = await doc.save();
    return new Response(pdfBytes, {
      headers: { ...corsHeaders, 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="homehub-claim.pdf"' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
