import { z } from 'zod';

export const TicketCreateSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  category: z.enum(['plumbing','electrical','hvac','carpentry','painting','cleaning','pest_control','locksmith','appliance','general','other']).default('general'),
  priority: z.enum(['emergency','urgent','routine','cosmetic']).default('routine'),
  photoStoragePaths: z.array(z.string()).optional(),
  preferredTimes: z.array(z.object({ start: z.string(), end: z.string() })).optional(),
});
export type TicketCreate = z.infer<typeof TicketCreateSchema>;

export const QuoteCreateSchema = z.object({
  ticketId: z.string().uuid(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default('AUD'),
  description: z.string().optional(),
  validUntil: z.string().date().optional(),
  attachments: z.array(z.string()).optional(),
});
export type QuoteCreate = z.infer<typeof QuoteCreateSchema>;
