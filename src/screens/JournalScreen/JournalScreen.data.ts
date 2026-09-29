import type { ImageSourcePropType } from 'react-native';
import type { Memory } from '../../models/memory';
import type { Trip } from '../../models/trip';
import { resolveTripDates, todayIso } from '../../models/tripDates';

export type JournalEntry = Memory & {
  title: string;
  city: string;
  date: string;
  photos: ImageSourcePropType[];
};

export function formatDate(date: string) {
  const calendarDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date;
  return new Date(calendarDate).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function journalTripDays(trip: Trip, now = new Date()) {
  const dates = resolveTripDates(trip, now);
  if (!dates) return [];
  const start = new Date(`${dates.startDate}T12:00:00Z`).getTime();
  const end = new Date(`${dates.endDate}T12:00:00Z`).getTime();
  const days: string[] = [];
  for (let cursor = start; cursor <= end && days.length < 366; cursor += 86400000)
    days.push(new Date(cursor).toISOString().slice(0, 10));
  return days;
}

export function defaultJournalDay(days: string[], now = new Date()) {
  const today = todayIso(now);
  return days.includes(today) ? today : (days[0] ?? today);
}
