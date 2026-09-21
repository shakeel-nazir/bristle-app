export const DEPOSIT_RATE = 0.5;

// Sales tax by province. Each tax is worked out on the price before tax, then rounded to the cent.
// Quebec charges GST and QST as two separate taxes; Ontario charges the single HST.
export const TAX_RULES = {
  ON: [{ name: 'HST', rate: 0.13, note: 'Ontario' }],
  QC: [
    { name: 'GST', rate: 0.05, note: 'Canada' },
    { name: 'QST', rate: 0.09975, note: 'Quebec' },
  ],
};

const percentText = (rate) => `${Math.round(rate * 100000) / 1000}%`;
const taxLabel = (t) => `${t.name} (${percentText(t.rate)}, ${t.note})`;

// Addresses from the address search end in ", ON K1P 5N5" or ", QC J8X 3X0".
export function provinceOf(address) {
  return /,\s*QC\b/i.test(address || '') ? 'QC' : 'ON';
}

export function getPriceBreakdown(price, discountPercent = 0, province = 'ON') {
  const subtotal = price;
  const discountAmount = Math.round(subtotal * (discountPercent / 100) * 100) / 100;
  const discountedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100;
  const taxLines = (TAX_RULES[province] || TAX_RULES.ON).map((t) => ({
    label: taxLabel(t),
    amount: Math.round(discountedSubtotal * t.rate * 100) / 100,
  }));
  const tax = Math.round(taxLines.reduce((sum, t) => sum + t.amount, 0) * 100) / 100;
  const total = Math.round((discountedSubtotal + tax) * 100) / 100;
  const deposit = Math.round(total * DEPOSIT_RATE * 100) / 100;
  const balance = Math.round((total - deposit) * 100) / 100;
  return { subtotal, discountAmount, discountedSubtotal, tax, taxLines, total, deposit, balance };
}
