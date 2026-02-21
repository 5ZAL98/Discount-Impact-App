export interface DiscountImpactResult {
  newPrice: number;
  currentProfit: number;
  newProfit: number;
  currentMarginPercent: number;
  newMarginPercent: number;
  breakEvenIncreasePercent: number | null;
}

export function calculateDiscountImpact(
  price: number,
  cost: number,
  discountPercent: number,
): DiscountImpactResult {
  const newPrice = price * (1 - discountPercent / 100);
  const currentProfit = price - cost;
  const newProfit = newPrice - cost;
  const currentMarginPercent = price > 0 ? (currentProfit / price) * 100 : 0;
  const newMarginPercent = newPrice > 0 ? (newProfit / newPrice) * 100 : 0;
  const breakEvenIncreasePercent =
    newProfit > 0 ? (currentProfit / newProfit - 1) * 100 : null;

  return {
    newPrice,
    currentProfit,
    newProfit,
    currentMarginPercent,
    newMarginPercent,
    breakEvenIncreasePercent,
  };
}
