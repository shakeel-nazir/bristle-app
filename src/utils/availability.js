import { checkCleaner, parseSlot, slotsOverlap } from './matching';

// supply = { cleaners: [{ id, days, timeBlocks }], busy: [{ id, date, time, hours, cleanerId, active }] }
// Neither list contains any personal details, so customers are allowed to read them.

function busyAsBookings(supply) {
  return supply.busy
    .filter((b) => b.active !== false)
    .map((b) => ({
      id: b.id,
      date: b.date,
      time: b.time,
      service: { duration: `${b.hours || 2} hrs` },
      cleanerId: b.cleanerId || null,
      status: 'active',
    }));
}

// Which of `times` (e.g. "9:00 AM") can still be booked on `dateStr` (e.g. "Sat, Sep 26")?
// A time is open when there are more free, qualified cleaners than unassigned jobs already
// waiting for one at overlapping times. (Slightly cautious on purpose: it hides a time rather than double-book.)
export function openTimesFor(dateStr, service, supply, times) {
  const jobs = busyAsBookings(supply);
  return times.filter((time) => {
    const candidate = { id: 'new', date: dateStr, time, service };
    const slot = parseSlot(candidate);
    if (!slot) return false;
    const freeCleaners = supply.cleaners.filter((c) => checkCleaner(c, candidate, jobs).ok).length;
    const waiting = jobs.filter(
      (j) => !j.cleanerId && j.date === dateStr && slotsOverlap(slot, parseSlot(j)),
    ).length;
    return freeCleaners > waiting;
  });
}
