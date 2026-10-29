// Money is stored as integer cents. Never use floats for money.
export type Cents = number & { readonly __brand: 'Cents' };
export const cents = (n: number): Cents => Math.round(n) as Cents;
export const toDollars = (c: Cents): string => (c / 100).toFixed(2);
export const fromDollars = (s: string | number): Cents =>
  cents(Math.round(Number(s) * 100));
export const DEFAULT_CURRENCY = 'AUD';
export const formatMoney = (c: Cents, currency = DEFAULT_CURRENCY): string =>
  new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(c / 100);
