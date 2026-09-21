const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "Sat, Sep 26" — the format bookings store their date in.
export function formatBookingDate(date) {
  return `${WEEKDAY_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

export const TIME_SLOTS = ['9:00 AM', '11:00 AM', '1:00 PM', '3:00 PM'];
