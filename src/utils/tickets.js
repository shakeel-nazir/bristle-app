export const TICKET_CATEGORIES = ['Booking', 'Payment', 'Cleaner', 'Something else'];

export const TICKET_STATUS_LABELS = {
  open: 'Waiting for reply',
  answered: 'Answered',
  closed: 'Closed',
};

export function formatTicketTime(ms) {
  if (!ms) return '';
  return new Date(ms).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
}
