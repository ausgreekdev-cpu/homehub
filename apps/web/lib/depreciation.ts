export function calculateDepreciation(
  purchasePriceCents: number,
  purchaseDate: string,
  depreciationRatePercent: number = 20
): { currentValueCents: number; depreciationCents: number } {
  const purchase = new Date(purchaseDate)
  const now = new Date()
  const years = (now.getTime() - purchase.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  const depreciationFactor = Math.max(0, 1 - (depreciationRatePercent / 100) * years)
  const currentValueCents = Math.round(purchasePriceCents * depreciationFactor)
  const depreciationCents = purchasePriceCents - currentValueCents
  
  return { currentValueCents, depreciationCents }
}
