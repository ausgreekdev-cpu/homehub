import { z } from 'zod';

export const DetectedItemSchema = z.object({
  name: z.string(),
  brand: z.string().optional().nullable(),
  modelNumber: z.string().optional().nullable(),
  serialNumber: z.string().optional().nullable(),
  category: z.enum(['appliance','furniture','electronics','fixture','outdoor','tool','vehicle','other']),
  condition: z.enum(['new','good','fair','poor','damaged']),
  estimatedReplacementValueCents: z.number().int().nonnegative(),
  confidence: z.number().min(0).max(1),
  boundingBox: z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() }).optional(),
  notes: z.string().optional().nullable(),
});
export type DetectedItem = z.infer<typeof DetectedItemSchema>;

export const ScanResultSchema = z.object({
  items: z.array(DetectedItemSchema),
  roomType: z.string().optional().nullable(),
  overallConfidence: z.number().min(0).max(1).optional(),
});
export type ScanResult = z.infer<typeof ScanResultSchema>;

export const INVENTORY_SCAN_PROMPT = `You are an inventory appraiser. Analyze the image and identify every distinct physical object suitable for a household/property inventory (appliances, furniture, electronics, fixtures, outdoor items, tools). For each item return: name, brand (if visible), model number (if visible on a label/plate), serial number (if visible), category, condition (new/good/fair/poor/damaged), estimated replacement value in cents (AUD), confidence (0-1), bounding box (normalized 0-1: x,y,w,h of the item), and notes. Also estimate the room type and overall confidence. Return ONLY valid JSON matching: {"items":[...],"roomType":string|null,"overallConfidence":number}. No prose.`;

export async function requestInventoryScan(
  invoke: (name: string, body: unknown) => Promise<{ data: unknown; error: { message: string } | null }>,
  scanId: string,
): Promise<ScanResult> {
  const { data, error } = await invoke('scan-inventory', { scanId });
  if (error) throw new Error(error.message);
  return ScanResultSchema.parse(data);
}
