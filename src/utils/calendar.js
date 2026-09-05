function parseTime(timeStr) {
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return { hours: 9, minutes: 0 };
  let hours = parseInt(match[1], 10) % 12;
  if (match[3].toUpperCase() === 'PM') hours += 12;
  return { hours, minutes: parseInt(match[2], 10) };
}

function parseDurationHours(durationStr) {
  const match = durationStr?.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : 2;
}

function formatUtc(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function buildGoogleCalendarUrl({ rawDate, time, service, address }) {
  const start = new Date(rawDate);
  const { hours, minutes } = parseTime(time);
  start.setHours(hours, minutes, 0, 0);
  const end = new Date(start.getTime() + parseDurationHours(service.duration) * 60 * 60 * 1000);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Bristle: ${service.name}`,
    dates: `${formatUtc(start)}/${formatUtc(end)}`,
    details: service.tasks?.length
      ? `Tasks: ${service.tasks.map((t) => t.label).join(', ')}`
      : 'Booked via Bristle',
    location: address || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
