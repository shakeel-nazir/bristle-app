export const DEPOSIT_RATE = 0.5;

export function getDepositBreakdown(price) {
  const deposit = Math.round(price * DEPOSIT_RATE * 100) / 100;
  const balance = Math.round((price - deposit) * 100) / 100;
  return { deposit, balance };
}
