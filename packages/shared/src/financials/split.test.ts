import { describe, it, expect } from 'vitest';
import { computeSplits } from './split';

describe('computeSplits', () => {
  const members = [
    { id: '1', propertyId: 'p', userId: 'a', role: 'tenant' as const, status: 'active' as const },
    { id: '2', propertyId: 'p', userId: 'b', role: 'tenant' as const, status: 'active' as const },
  ];

  it('splits equally', () => {
    const res = computeSplits({ amountCents: 100, method: 'equal', members });
    expect(res).toHaveLength(2);
    expect(res[0].shareCents + res[1].shareCents).toBe(100);
    expect(res[0].shareCents).toBe(50);
  });

  it('handles remainder cents', () => {
    const res = computeSplits({ amountCents: 101, method: 'equal', members });
    expect(res[0].shareCents + res[1].shareCents).toBe(101);
  });

  it('custom amounts', () => {
    const res = computeSplits({ amountCents: 100, method: 'custom_amount', members, customAmounts: { a: 30, b: 70 } });
    expect(res[0].shareCents).toBe(30);
    expect(res[1].shareCents).toBe(70);
  });

  it('by occupancy days', () => {
    const res = computeSplits({ amountCents: 100, method: 'by_occupancy_days', members, occupancyDays: { a: 3, b: 7 } });
    expect(res[0].shareCents + res[1].shareCents).toBe(100);
    expect(res[0].shareCents).toBeLessThan(res[1].shareCents);
  });

  it('returns empty for no active members', () => {
    const res = computeSplits({ amountCents: 100, method: 'equal', members: [{ ...members[0], status: 'removed' as const }] });
    expect(res).toHaveLength(0);
  });
});
