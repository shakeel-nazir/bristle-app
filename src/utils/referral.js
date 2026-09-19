export const REFERRAL_DISCOUNT_PERCENT = 25;

export function getMyReferralCode(name = 'Andrew') {
  const first = name.trim().split(' ')[0] || 'FRIEND';
  return `${first.toUpperCase()}${REFERRAL_DISCOUNT_PERCENT}`;
}
