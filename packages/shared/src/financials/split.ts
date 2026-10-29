import type { SplitMethod, Membership } from '../types';

export interface SplitInput {
  amountCents: number;
  method: SplitMethod;
  members: Membership[];
  // for custom methods
  customPercentages?: Record<string, number>; // userId -> pct (0..100)
  customAmounts?: Record<string, number>;      // userId -> cents
  occupancyDays?: Record<string, number>;     // userId -> days
}

export interface SplitResult {
  userId: string;
  shareCents: number;
  percentage?: number;
  daysOccupied?: number;
}

function allocateRemainder(shares: SplitResult[], total: number) {
  // largest-remainder method to avoid off-by-cent
  const sum = shares.reduce((a, s) => a + s.shareCents, 0);
  let remainder = total - sum;
  // distribute +1 cent to largest fractional... here simply to first members
  let i = 0;
  while (remainder > 0 && i < shares.length) {
    shares[i]!.shareCents += 1;
    remainder -= 1;
    i++;
    if (i === shares.length) i = 0;
  }
}

export function computeSplits(input: SplitInput): SplitResult[] {
  const { amountCents, method, members } = input;
  const active = members.filter((m) => m.status === 'active');
  if (active.length === 0) return [];

  let shares: SplitResult[] = [];

  switch (method) {
    case 'equal': {
      const base = Math.floor(amountCents / active.length);
      shares = active.map((m) => ({ userId: m.userId, shareCents: base }));
      allocateRemainder(shares, amountCents);
      break;
    }
    case 'by_income': {
      const weights = active.map((m) => ({ m, w: m.incomeShare ?? 0 }));
      const totalW = weights.reduce((a, x) => a + x.w, 0) || active.length;
      const norm = totalW === 0 ? active.length : totalW;
      shares = weights.map(({ m, w }) => ({
        userId: m.userId,
        shareCents: Math.floor(amountCents * ((w || 1) / norm)),
        percentage: ((w || 1) / norm) * 100,
      }));
      allocateRemainder(shares, amountCents);
      break;
    }
    case 'by_room_size': {
      const weights = active.map((m) => ({ m, w: m.roomSizeSqm ?? 0 }));
      const totalW = weights.reduce((a, x) => a + x.w, 0) || active.length;
      const norm = totalW === 0 ? active.length : totalW;
      shares = weights.map(({ m, w }) => ({
        userId: m.userId,
        shareCents: Math.floor(amountCents * ((w || 1) / norm)),
        percentage: ((w || 1) / norm) * 100,
      }));
      allocateRemainder(shares, amountCents);
      break;
    }
    case 'by_occupancy_days': {
      const days = input.occupancyDays ?? {};
      const weights = active.map((m) => ({ m, d: days[m.userId] ?? 0 }));
      const totalD = weights.reduce((a, x) => a + x.d, 0) || active.length;
      const norm = totalD === 0 ? active.length : totalD;
      shares = weights.map(({ m, d }) => ({
        userId: m.userId,
        shareCents: Math.floor(amountCents * ((d || 1) / norm)),
        percentage: ((d || 1) / norm) * 100,
        daysOccupied: d || 1,
      }));
      allocateRemainder(shares, amountCents);
      break;
    }
    case 'custom_pct': {
      const pcts = input.customPercentages ?? {};
      shares = active.map((m) => {
        const p = pcts[m.userId] ?? 0;
        return { userId: m.userId, shareCents: Math.floor(amountCents * (p / 100)), percentage: p };
      });
      allocateRemainder(shares, amountCents);
      break;
    }
    case 'custom_amount': {
      const amts = input.customAmounts ?? {};
      shares = active.map((m) => ({ userId: m.userId, shareCents: amts[m.userId] ?? 0 }));
      break;
    }
  }
  return shares;
}
