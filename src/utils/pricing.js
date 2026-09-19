export const DEPOSIT_RATE = 0.5;
export const HST_RATE = 0.13; // Ontario HST

export function getPriceBreakdown(price, discountPercent = 0) {
  const subtotal = price;
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;
  const tax = Math.round(discountedSubtotal * HST_RATE * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;
  const deposit = Math.round(total * DEPOSIT_RATE * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;
  return { subtotal, discountAmount, discountedSubtotal, tax, total, deposit, balance };
}
