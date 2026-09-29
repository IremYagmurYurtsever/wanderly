import { todayIso, validIsoDate } from './tripDates';

export type Visa = {
  id: string;
  countryCode: string;
  validFrom: string;
  durationDays: number;
};
export type VisaDraft = Omit<Visa, 'id'>;

export function decodeVisas(value: unknown): Visa[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (item) =>
        item &&
        typeof item.id === 'string' &&
        typeof item.countryCode === 'string' &&
        typeof item.validFrom === 'string' &&
        validIsoDate(item.validFrom) &&
        Number.isInteger(item.durationDays) &&
        item.durationDays > 0 &&
        item.durationDays <= 3650,
    )
  )
    throw new Error('Invalid visas');
  return value as Visa[];
}

export function visaExpiry(visa: VisaDraft, today = todayIso()) {
  const start = new Date(`${visa.validFrom}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() + visa.durationDays - 1);
  const expiresOn = start.toISOString().slice(0, 10);
  const daysLeft = Math.ceil(
    (Date.parse(`${expiresOn}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400000,
  );
  return { expiresOn, daysLeft, expired: daysLeft < 0 };
}
