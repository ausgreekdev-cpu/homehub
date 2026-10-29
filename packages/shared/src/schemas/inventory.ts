import { z } from 'zod';

export const InventoryItemCreateSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(200),
  brand: z.string().optional(),
  modelNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  category: z.enum(['appliance','furniture','electronics','fixture','outdoor','tool','vehicle','other']).default('other'),
  condition: z.enum(['new','good','fair','poor','damaged']).default('good'),
  purchaseDate: z.string().date().optional(),
  purchasePriceCents: z.number().int().nonnegative().optional(),
  replacementValueCents: z.number().int().nonnegative().optional(),
  warrantyExpiry: z.string().date().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type InventoryItemCreate = z.infer<typeof InventoryItemCreateSchema>;

export const BulkImportRowSchema = InventoryItemCreateSchema.omit({ propertyId: true });
export type BulkImportRow = z.infer<typeof BulkImportRowSchema>;
