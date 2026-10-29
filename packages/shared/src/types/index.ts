export type UUID = string;
export type UserRole = 'tenant' | 'landlord' | 'agent' | 'contractor';
export type MembershipStatus = 'invited' | 'active' | 'removed';
export type ExpenseType = 'rent' | 'utility' | 'internet' | 'insurance' | 'maintenance' | 'cleaning' | 'other';
export type SplitMethod = 'equal' | 'by_income' | 'by_room_size' | 'by_occupancy_days' | 'custom_pct' | 'custom_amount';
export type ExpenseStatus = 'draft' | 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
export type TicketStatus = 'open' | 'triaged' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'invoiced' | 'closed' | 'rejected';
export type TicketPriority = 'emergency' | 'urgent' | 'routine' | 'cosmetic';
export type TradeCategory = 'plumbing' | 'electrical' | 'hvac' | 'carpentry' | 'painting' | 'cleaning' | 'pest_control' | 'locksmith' | 'appliance' | 'general' | 'other';
export type InventoryCategory = 'appliance' | 'furniture' | 'electronics' | 'fixture' | 'outdoor' | 'tool' | 'vehicle' | 'other';
export type ItemCondition = 'new' | 'good' | 'fair' | 'poor' | 'damaged';
export type ReportType = 'move_in' | 'move_out' | 'periodic' | 'incident';

export interface Profile {
  id: UUID;
  displayName: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  defaultRole: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: UUID;
  name: string;
  address: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  country: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
  floorAreaSqm?: number;
  ownerId?: UUID;
  agentId?: UUID;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: UUID;
  propertyId: UUID;
  userId: UUID;
  role: UserRole;
  status: MembershipStatus;
  roomSizeSqm?: number;
  incomeShare?: number;
  moveInDate?: string;
  moveOutDate?: string;
}
