import { z } from 'zod';

export const ExpenseCreateSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
  type: z.enum(['rent','utility','internet','insurance','maintenance','cleaning','other']).default('other'),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default('AUD'),
  dueDate: z.string().date().optional(),
  incurredDate: z.string().date().optional(),
  splitMethod: z.enum(['equal','by_income','by_room_size','by_occupancy_days','custom_pct','custom_amount']).default('equal'),
  receiptStoragePath: z.string().optional(),
  recurrenceRule: z.string().optional(),
});
export type ExpenseCreate = z.infer<typeof ExpenseCreateSchema>;

export const ExpenseSplitInputSchema = z.object({
  userId: z.string().uuid(),
  percentage: z.number().min(0).max(100).optional(),
  amountCents: z.number().int().nonnegative().optional(),
  daysOccupied: z.number().int().nonnegative().optional(),
});
export type ExpenseSplitInput = z.infer<typeof ExpenseSplitInputSchema>;

export const ExpenseWithSplitsSchema = ExpenseCreateSchema.extend({
  splits: z.array(ExpenseSplitInputSchema).min(1),
});
export type ExpenseWithSplits = z.infer<typeof ExpenseWithSplitsSchema>;
