// Time blocks cleaners choose on their application, as [startHour, endHour) in 24h time.
const BLOCKS = [
  { name: 'Morning', from: 6, to: 12 },
  { name: 'Afternoon', from: 12, to: 17 },
  { name: 'Evening', from: 17, to: 22 },
];

const DAY_PLURAL = {
  Mon: 'Mondays',
  Tue: 'Tuesdays',
  Wed: 'Wednesdays',
  Thu: 'Thursdays',
  Fri: 'Fridays',
  Sat: 'Saturdays',
  Sun: 'Sundays',
};

export function isActiveJob(b) {
  return !b.status || b.status === 'active' || b.status === 'on_the_way' || b.status === 'in_progress';
}

// Reads a booking's weekday ("Sat"), start hour (9 for "9:00 AM") and length in hours.
export function parseSlot(booking) {
  const day = String(booking.date || '').slice(0, 3);
  const m = /(\d+):(\d+)\s*(AM|PM)/i.exec(booking.time || '');
  if (!m) return null;
  let start = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') start += 12;
  const hoursMatch =
    /(\d+)/.exec(booking.service?.duration || '') || /(\d+)-Hour/i.exec(booking.service?.name || '');
  const hours = hoursMatch ? Number(hoursMatch[1]) : 2;
  return { day, start: start + Number(m[2]) / 60, hours, end: start + Number(m[2]) / 60 + hours };
}

function blocksNeeded(slot) {
  const needed = new Set();
  for (let h = Math.floor(slot.start); h < slot.end; h += 1) {
    const block = BLOCKS.find((b) => h >= b.from && h < b.to);
    if (block) needed.add(block.name);
  }
  return Array.from(needed);
}

// Do two parsed slots (from parseSlot) overlap in time?
export function slotsOverlap(a, b) {
  return !!a && !!b && a.start < b.end && b.start < a.end;
}

export function describeSlot(booking) {
  const slot = parseSlot(booking);
  return slot ? `${booking.date} · ${booking.time} · ${slot.hours} hrs` : `${booking.date} · ${booking.time}`;
}

// Is this cleaner (an approved application) free for this booking?
// Returns { ok: true } or { ok: false, reason }.
export function checkCleaner(cleaner, booking, allBookings) {
  const slot = parseSlot(booking);
  if (!slot) return { ok: false, reason: "Can't read this booking's time" };

  if (!(cleaner.days || []).includes(slot.day)) {
    return { ok: false, reason: `Doesn't work ${DAY_PLURAL[slot.day] || slot.day}` };
  }

  const missing = blocksNeeded(slot).filter((b) => !(cleaner.timeBlocks || []).includes(b));
  if (missing.length) {
    return { ok: false, reason: `Not available in the ${missing.join(' / ').toLowerCase()}` };
  }

  const clash = allBookings.find((other) => {
    if (other.id === booking.id || other.cleanerId !== cleaner.id || !isActiveJob(other)) return false;
    if (other.date !== booking.date) return false;
    return slotsOverlap(slot, parseSlot(other));
  });
  if (clash) return { ok: false, reason: `Already booked at ${clash.time} that day` };

  return { ok: true };
}
