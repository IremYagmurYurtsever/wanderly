import { AuthError } from '../auth/validation.js';
import { getCountry } from '../places/countries.js';

export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new AuthError(400, 'INVALID_INPUT', 'Geçerli bir kayıt gönder.');
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, max: number, min = 1) {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max)
    throw new AuthError(400, 'INVALID_INPUT', `${label} ${min}–${max} karakter olmalı.`);
  return value.trim();
}
export function uuid(value: unknown) {
  const id = text(value, 'Kayıt kimliği', 36);
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id))
    throw new AuthError(400, 'INVALID_INPUT', 'Kayıt kimliği geçersiz.');
  return id;
}
export function currency(value: unknown) {
  if (typeof value !== 'string' || !['TRY', 'EUR', 'USD', 'GBP', 'JPY'].includes(value))
    throw new AuthError(400, 'INVALID_INPUT', 'Para birimi geçersiz.');
  return value;
}
export function boolean(value: unknown) {
  if (typeof value !== 'boolean') throw new AuthError(400, 'INVALID_INPUT', 'Seçim geçersiz.');
  return value;
}
export function profileInput(value: unknown) {
  const data = object(value);
  if (
    data.preferences !== undefined &&
    (!Array.isArray(data.preferences) || data.preferences.length > 20)
  )
    throw new AuthError(400, 'INVALID_INPUT', 'En fazla 20 tercih ekleyebilirsin.');
  return {
    ...(data.name !== undefined && { name: text(data.name, 'Ad', 100, 2) }),
    ...(data.bio !== undefined && { bio: text(data.bio, 'Biyografi', 1000, 0) }),
    ...(data.avatarDataUrl !== undefined && { avatarDataUrl: photoDataUrl(data.avatarDataUrl) }),
    ...(data.phone !== undefined && { phone: phoneNumber(data.phone) }),
    ...(data.preferences !== undefined && {
      preferences: [
        ...new Set((data.preferences as unknown[]).map((item) => text(item, 'Tercih', 60))),
      ],
    }),
    ...(data.currency !== undefined && { currency: currency(data.currency) }),
  };
}

export function phoneNumber(value: unknown) {
  if (value === null || value === '') return null;
  if (typeof value !== 'string')
    throw new AuthError(400, 'INVALID_INPUT', 'Telefon numarası geçersiz.');
  const normalized = value.replace(/[\s()-]/g, '');
  if (!/^\+?[1-9]\d{9,14}$/.test(normalized))
    throw new AuthError(400, 'INVALID_INPUT', 'Telefon numarasını ülke koduyla gir.');
  return normalized;
}

export function visaInput(value: unknown) {
  const data = object(value);
  const countryCode = text(data.countryCode, 'Ülke', 2, 2).toUpperCase();
  if (!getCountry(countryCode)) throw new AuthError(400, 'INVALID_INPUT', 'Desteklenmeyen ülke.');
  const durationDays = data.durationDays;
  if (
    !Number.isInteger(durationDays) ||
    (durationDays as number) < 1 ||
    (durationDays as number) > 3650
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Vize süresi 1–3650 gün olmalı.');
  return { countryCode, validFrom: tripDate(data.validFrom), durationDays: durationDays as number };
}
export function tripInput(value: unknown) {
  const data = object(value);
  const startDate = data.startDate === undefined ? undefined : tripDate(data.startDate);
  const endDate = data.endDate === undefined ? undefined : tripDate(data.endDate);
  if (
    (startDate === undefined) !== (endDate === undefined) ||
    (startDate && endDate && endDate < startDate)
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Gidiş ve dönüş tarihlerini sırayla seç.');
  if (
    startDate &&
    endDate &&
    (new Date(`${endDate}T12:00:00Z`).getTime() - new Date(`${startDate}T12:00:00Z`).getTime()) /
      86400000 >
      365
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Bir yolculuk en fazla 365 gün sürebilir.');
  const countryCode =
    data.countryCode === undefined ? undefined : text(data.countryCode, 'Ülke', 2, 2).toUpperCase();
  if (countryCode && !getCountry(countryCode))
    throw new AuthError(400, 'INVALID_INPUT', 'Desteklenmeyen ülke.');
  return {
    destination: text(data.destination, 'Varış noktası', 200),
    dates: text(data.dates, 'Tarihler', 100),
    ...(countryCode !== undefined && { countryCode }),
    ...(startDate !== undefined && { startDate }),
    ...(endDate !== undefined && { endDate }),
    ...(data.notes !== undefined && { notes: text(data.notes, 'Notlar', 5000, 0) }),
    ...(data.budget !== undefined && { budget: text(data.budget, 'Bütçe', 50, 0) }),
    ...(data.currency !== undefined && { currency: currency(data.currency) }),
    ...(data.stops !== undefined && { stops: tripStops(data.stops) }),
  };
}

function tripDate(value: unknown) {
  const date = text(value, 'Tarih', 10, 10);
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Geçerli bir takvim tarihi seç.');
  return date;
}

export function memoryInput(value: unknown) {
  const data = object(value);
  return {
    text: text(data.text, 'Anı', 5000),
    ...(data.tripId !== undefined && { tripId: data.tripId === null ? null : uuid(data.tripId) }),
    ...(data.placeName !== undefined && {
      placeName: data.placeName === null ? null : text(data.placeName, 'Mekân', 200, 0) || null,
    }),
    ...(data.visitedAt !== undefined && {
      visitedAt: data.visitedAt === null ? null : tripDate(data.visitedAt),
    }),
    ...(data.photoDataUrl !== undefined && { photoDataUrl: photoDataUrl(data.photoDataUrl) }),
  };
}

function photoDataUrl(value: unknown) {
  if (value === null) return null;
  if (
    typeof value !== 'string' ||
    !/^data:image\/jpeg;base64,[A-Za-z0-9+/]+={0,2}$/.test(value) ||
    value.length > 1_500_000
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Fotoğraf JPEG olmalı ve 1 MB sınırını aşmamalı.');
  return value;
}

function tripStops(value: unknown) {
  if (!Array.isArray(value) || value.length > 40)
    throw new AuthError(
      400,
      'INVALID_INPUT',
      'En fazla 10 konaklama ve 30 gezilecek yer ekleyebilirsin.',
    );
  const stops = value.map((item) => {
    const stop = object(item);
    if (stop.kind !== 'hotel' && stop.kind !== 'place')
      throw new AuthError(400, 'INVALID_INPUT', 'Durak türü geçersiz.');
    const mapsUrl = text(stop.mapsUrl, 'Harita bağlantısı', 1000);
    let url: URL;
    try {
      url = new URL(mapsUrl);
    } catch {
      throw new AuthError(400, 'INVALID_INPUT', 'Harita bağlantısı geçersiz.');
    }
    if (
      url.protocol !== 'https:' ||
      !(
        url.hostname === 'maps.google.com' ||
        (url.hostname === 'www.google.com' && url.pathname.startsWith('/maps'))
      )
    )
      throw new AuthError(400, 'INVALID_INPUT', 'Google Haritalar bağlantısı gerekli.');
    return {
      kind: stop.kind,
      placeId: text(stop.placeId, 'Mekân kimliği', 512),
      title: text(stop.title, 'Mekân adı', 200),
      address: text(stop.address, 'Adres', 500, 0),
      mapsUrl,
    };
  });
  if (
    stops.filter((stop) => stop.kind === 'hotel').length > 10 ||
    stops.filter((stop) => stop.kind === 'place').length > 30 ||
    new Set(stops.map((stop) => `${stop.kind}:${stop.placeId}`)).size !== stops.length
  )
    throw new AuthError(400, 'INVALID_INPUT', 'Aynı durak birden fazla eklenemez.');
  return stops;
}
