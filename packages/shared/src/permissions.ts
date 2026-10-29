import type { UserRole } from './types';

export const PERMISSIONS = {
  property: {
    read: ['tenant','landlord','agent','contractor'],
    manage: ['landlord','agent'],
  },
  expense: {
    create: ['tenant','landlord','agent'],
    approve: ['landlord','agent'],
    viewLedger: ['tenant','landlord','agent'],
  },
  inventory: {
    scan: ['tenant','landlord','agent'],
    manageAssets: ['landlord','agent'],
    exportClaim: ['tenant','landlord','agent'],
  },
  maintenance: {
    raise: ['tenant','landlord','agent'],
    triage: ['landlord','agent'],
    quote: ['contractor'],
    checkin: ['contractor'],
    invoice: ['contractor'],
  },
  tenancy: {
    manageLease: ['landlord','agent'],
    signRule: ['tenant','landlord','agent'],
    conditionReport: ['landlord','agent'],
  },
  messaging: {
    send: ['tenant','landlord','agent','contractor'],
  },
} as const;

export function can(role: UserRole, area: keyof typeof PERMISSIONS, action: string): boolean {
  const areaPerms = PERMISSIONS[area] as Record<string, readonly UserRole[]>;
  const roles = areaPerms[action];
  return !!roles && roles.includes(role);
}
