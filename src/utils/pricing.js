export const DEPOSIT_RATE = 0.5;
export const HST_RATE = 0.13; // Ontario HST

export function getPriceBreakdown(price) {
  const subtotal = price;
  const tax = Math.round(subtotal * HST_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const deposit = Math.round(total * DEPOSIT_RATE * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;
  return { subtotal, tax, total, deposit, balance };
}
