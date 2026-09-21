// Turns a booking that has been started (status 'in_progress', startedMs = when the admin pressed
// Start) into what the Home screen shows. Tasks run one after another, each for its own minutes.
const MIN = 60 * 1000;

// Hours the customer booked ("4 hrs" or "4-Hour Clean").
function bookedHours(booking) {
  const match = /(\d+)/.exec(booking.service?.duration || '') || /(\d+)-Hour/i.exec(booking.service?.name || '');
  return match ? Number(match[1]) : 2;
}

// The list of work with the minutes planned for each. The minutes are stretched or squeezed to fill
// exactly the time that was booked (tasks added by the admin default to 20 minutes, which would
// otherwise leave the total off). Falls back to one block for the whole clean.
export function planTasks(booking) {
  const bookedMinutes = bookedHours(booking) * 60;
  const tasks = (booking.service?.tasks || []).filter((t) => t.label);
  if (!tasks.length) return [{ label: booking.service?.name || 'Your clean', minutes: bookedMinutes }];
  const planned = tasks.map((t) => Math.max(1, Number(t.minutes) || 20));
  const sum = planned.reduce((a, b) => a + b, 0);
  const scale = bookedMinutes / sum;
  return tasks.map((t, i) => ({ label: t.label, minutes: Math.max(1, Math.round(planned[i] * scale)) }));
}

export function timerState(booking, nowMs) {
  const plan = planTasks(booking);
  const totalMs = plan.reduce((sum, t) => sum + t.minutes * MIN, 0);
  const elapsedMs = Math.max(0, nowMs - (booking.startedMs ?? nowMs));

  let cursor = 0;
  let currentIndex = -1;
  const tasks = plan.map((t, i) => {
    const length = t.minutes * MIN;
    const start = cursor;
    cursor += length;
    let state = 'upcoming';
    if (elapsedMs >= cursor) state = 'done';
    else if (elapsedMs >= start) {
      state = 'current';
      currentIndex = i;
    }
    return {
      label: t.label,
      minutes: t.minutes,
      state,
      leftMs: state === 'current' ? cursor - elapsedMs : state === 'done' ? 0 : length,
      progress: state === 'done' ? 1 : state === 'current' ? (elapsedMs - start) / length : 0,
    };
  });

  const finished = elapsedMs >= totalMs;
  return {
    tasks,
    currentIndex,
    totalMs,
    elapsedMs: Math.min(elapsedMs, totalMs),
    remainingMs: Math.max(0, totalMs - elapsedMs),
    progress: totalMs ? Math.min(1, elapsedMs / totalMs) : 1,
    finished,
    doneCount: tasks.filter((t) => t.state === 'done').length,
  };
}

// 4325000 -> "1:12:05", 65000 -> "1:05"
export function formatClock(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

// 4325000 -> "1 hr 12 min left", 540000 -> "9 min left"
export function formatLeft(ms) {
  const minutes = Math.max(0, Math.ceil(ms / MIN));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return m ? `${h} hr ${m} min left` : `${h} hr left`;
  return `${m} min left`;
}
