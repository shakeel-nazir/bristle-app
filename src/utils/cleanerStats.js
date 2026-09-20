import { isActiveJob, parseSlot } from './matching';

// Hours a cleaner offers per day for each block they tick on their application.
const BLOCK_HOURS = { Morning: 6, Afternoon: 5, Evening: 5 };
const DAY_MS = 24 * 3600 * 1000;

// Rough weekly capacity: (days they work) x (hours in the blocks they picked).
export function weeklyCapacityHours(cleaner) {
  const perDay = (cleaner.timeBlocks || []).reduce((sum, b) => sum + (BLOCK_HOURS[b] || 0), 0);
  return (cleaner.days || []).length * perDay;
}

// When a job starts, as a comparable number (unknown dates sort last).
function startMs(b) {
  const slot = parseSlot(b);
  const day = b.rawDate ? new Date(b.rawDate) : null;
  if (!day || Number.isNaN(day.getTime()) || !slot) return Infinity;
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  return d.getTime() + slot.start * 3600 * 1000;
}

export function cleanerStats(cleaner, bookings, now = new Date()) {
  const mine = bookings.filter((b) => b.cleanerId === cleaner.id);
  const done = mine.filter((b) => b.status === 'completed');
  const active = mine.filter(isActiveJob).sort((a, b) => startMs(a) - startMs(b));

  const hoursOf = (b) => parseSlot(b)?.hours || 0;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // Jobs with no usable date still count, so nobody looks freer than they are.
  const inNextWeek = active.filter((b) => {
    const t = startMs(b);
    return t === Infinity || (t >= startOfToday && t < startOfToday + 7 * DAY_MS);
  });

  const capacity = weeklyCapacityHours(cleaner);
  const bookedHours = inNextWeek.reduce((sum, b) => sum + hoursOf(b), 0);
  const freePercent = capacity > 0 ? Math.max(0, Math.round(100 - (bookedHours / capacity) * 100)) : 0;

  const enRoute = active.find((b) => b.status === 'on_the_way') || null;
  return {
    completed: done.length,
    completedHours: done.reduce((sum, b) => sum + hoursOf(b), 0),
    upcoming: active.length,
    capacity,
    bookedHours,
    freePercent,
    enRoute,
    next: enRoute ? null : active[0] || null,
    state: enRoute ? 'en_route' : active.length ? 'booked' : 'free',
  };
}
