import type { Trip } from './trip';

export function todayIso(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function validIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function formatTripDates(startDate: string, endDate: string) {
  const format = new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${format.format(new Date(`${startDate}T12:00:00Z`))} – ${format.format(new Date(`${endDate}T12:00:00Z`))}`;
}

const months: Record<string, number> = {
  oca: 1,
  şub: 2,
  mar: 3,
  nis: 4,
  may: 5,
  haz: 6,
  tem: 7,
  ağu: 8,
  eyl: 9,
  eki: 10,
  kas: 11,
  ara: 12,
};

function legacyTripDates(dates: string | undefined, now: Date) {
  const parts = dates?.split(/\s+[–—-]\s+/);
  if (parts?.length !== 2) return null;
  const parsed = parts.map((part) => {
    const match = /^(\d{1,2})\s+([^\d\s]+)(?:\s+(\d{4}))?$/u.exec(part.trim());
    if (!match) return null;
    const month = months[match[2].replace('.', '').toLocaleLowerCase('tr-TR')];
    return month
      ? { day: Number(match[1]), month, year: match[3] ? Number(match[3]) : null }
      : null;
  });
  const [departure, arrival] = parsed;
  if (!departure || !arrival || (departure.year === null) !== (arrival.year === null)) return null;
  let year = departure.year ?? now.getFullYear();
  const iso = (day: number, month: number, dateYear: number) =>
    `${dateYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  let startDate = iso(departure.day, departure.month, year);
  let endDate = iso(
    arrival.day,
    arrival.month,
    arrival.year ?? (arrival.month < departure.month ? year + 1 : year),
  );
  if (departure.year === null && endDate < todayIso(now)) {
    year += 1;
    startDate = iso(departure.day, departure.month, year);
    endDate = iso(arrival.day, arrival.month, arrival.month < departure.month ? year + 1 : year);
  }
  return validIsoDate(startDate) && validIsoDate(endDate) && endDate >= startDate
    ? { startDate, endDate }
    : null;
}

export function resolveTripDates(
  trip: Pick<Trip, 'startDate' | 'endDate'> & Partial<Pick<Trip, 'dates'>>,
  now = new Date(),
) {
  const structured =
    trip.startDate && trip.endDate && validIsoDate(trip.startDate) && validIsoDate(trip.endDate)
      ? { startDate: trip.startDate, endDate: trip.endDate }
      : null;
  return structured ?? legacyTripDates(trip.dates, now);
}

export function tripTiming(
  trip: Pick<Trip, 'startDate' | 'endDate'> & Partial<Pick<Trip, 'dates'>>,
  now = new Date(),
) {
  const dates = resolveTripDates(trip, now);
  if (!dates) return { status: 'upcoming' as const, days: null };
  const today = todayIso(now);
  const current = new Date(`${today}T12:00:00Z`).getTime();
  if (dates.endDate < today) return { status: 'past' as const, days: 0 };
  if (dates.startDate <= today) {
    const end = new Date(`${dates.endDate}T12:00:00Z`).getTime();
    return { status: 'ongoing' as const, days: Math.round((end - current) / 86400000) };
  }
  const start = new Date(`${dates.startDate}T12:00:00Z`).getTime();
  return { status: 'upcoming' as const, days: Math.round((start - current) / 86400000) };
}
