import { z } from 'zod';

export const PropertyCreateSchema = z.object({
  name: z.string().min(1).max(120),
  address: z.string().min(1),
  suburb: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default('AU'),
  propertyType: z.enum(['house','apartment','unit','townhouse','commercial','other']).default('house'),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  floorAreaSqm: z.number().positive().optional(),
});
export type PropertyCreate = z.infer<typeof PropertyCreateSchema>;

export const MembershipCreateSchema = z.object({
  propertyId: z.string().uuid(),
  userId: z.string().uuid(),
  role: z.enum(['tenant','landlord','agent','contractor']),
  roomSizeSqm: z.number().positive().optional(),
  incomeShare: z.number().min(0).max(1).optional(),
  moveInDate: z.string().date().optional(),
  moveOutDate: z.string().date().optional(),
});
export type MembershipCreate = z.infer<typeof MembershipCreateSchema>;
