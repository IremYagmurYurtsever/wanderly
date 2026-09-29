export type TripStop = {
  id?: string;
  kind: 'hotel' | 'place';
  placeId: string;
  title: string;
  address: string;
  mapsUrl: string;
};
export type Trip = {
  destination: string;
  dates: string;
  custom?: boolean;
  countryCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  notes?: string | null;
  budget?: string | null;
  currency?: string | null;
  stops?: TripStop[];
};
export type SavedTrip = Trip & { id: string; custom: true };
export type Currency = 'TRY' | 'USD' | 'GBP' | 'JPY';
export type HomeData = {
  trip: Trip;
  trips: SavedTrip[];
  destination: string;
  dates: string;
  countryCode: string;
  startDate: string;
  endDate: string;
  amount: string;
  currency: Currency;
  reversed: boolean;
};
export type HomePreferences = Omit<HomeData, 'trip' | 'trips'>;

export const defaultHome: HomeData = {
  trip: { destination: 'Roma, İtalya', dates: '12 Eki – 17 Eki' },
  trips: [],
  destination: 'Floransa ve Toskana',
  dates: '4 Kas – 11 Kas',
  countryCode: 'IT',
  startDate: '',
  endDate: '',
  amount: '30',
  currency: 'TRY',
  reversed: false,
};

function isTrip(value: unknown): value is Trip {
  if (!value || typeof value !== 'object') return false;
  const trip = value as Record<string, unknown>;
  return (
    typeof trip.destination === 'string' &&
    typeof trip.dates === 'string' &&
    (trip.startDate == null || typeof trip.startDate === 'string') &&
    (trip.endDate == null || typeof trip.endDate === 'string') &&
    (trip.countryCode == null || typeof trip.countryCode === 'string') &&
    (trip.notes == null || typeof trip.notes === 'string') &&
    (trip.budget == null || typeof trip.budget === 'string') &&
    (trip.currency == null || typeof trip.currency === 'string') &&
    (trip.stops === undefined ||
      (Array.isArray(trip.stops) &&
        trip.stops.every(
          (stop) =>
            stop &&
            typeof stop === 'object' &&
            (stop.kind === 'hotel' || stop.kind === 'place') &&
            typeof stop.placeId === 'string' &&
            typeof stop.title === 'string' &&
            typeof stop.address === 'string' &&
            typeof stop.mapsUrl === 'string',
        ))) &&
    (trip.custom === undefined || typeof trip.custom === 'boolean')
  );
}

export function decodeHome(value: unknown): HomeData {
  if (!value || typeof value !== 'object') throw new Error('Invalid home data');
  const data = value as Record<string, unknown>;
  if (
    !isTrip(data.trip) ||
    typeof data.destination !== 'string' ||
    typeof data.dates !== 'string' ||
    typeof data.amount !== 'string' ||
    typeof data.reversed !== 'boolean' ||
    !['TRY', 'USD', 'GBP', 'JPY'].includes(String(data.currency))
  )
    throw new Error('Invalid home data');
  let trips: SavedTrip[];
  if (data.trips === undefined) {
    trips = data.trip.custom ? [{ ...data.trip, id: 'legacy-local-draft', custom: true }] : [];
  } else {
    if (
      !Array.isArray(data.trips) ||
      !data.trips.every(
        (trip) =>
          isTrip(trip) && 'id' in trip && typeof trip.id === 'string' && trip.custom === true,
      )
    )
      throw new Error('Invalid trip archive');
    trips = data.trips as SavedTrip[];
    if (new Set(trips.map((trip) => trip.id)).size !== trips.length)
      throw new Error('Duplicate trip IDs');
  }
  return {
    trip: data.trip,
    trips,
    destination: data.destination,
    dates: data.dates,
    countryCode: typeof data.countryCode === 'string' ? data.countryCode : 'IT',
    startDate: typeof data.startDate === 'string' ? data.startDate : '',
    endDate: typeof data.endDate === 'string' ? data.endDate : '',
    amount: data.amount,
    currency: data.currency as Currency,
    reversed: data.reversed,
  };
}

export function appendTrip(data: HomeData, draft: Trip, id: string): HomeData {
  const destination = draft.destination.trim();
  const dates = draft.dates.trim();
  if (!destination || !dates) throw new Error('Destination and dates are required');
  if (data.trips.some((trip) => trip.id === id)) throw new Error('Duplicate trip ID');
  const trip: SavedTrip = { ...draft, id, destination, dates, custom: true };
  return { ...data, trip, trips: [...data.trips, trip] };
}

export function replaceTrip(data: HomeData, id: string, draft: Trip): HomeData {
  const destination = draft.destination.trim();
  const dates = draft.dates.trim();
  if (!destination || !dates) throw new Error('Destination and dates are required');
  if (!data.trips.some((trip) => trip.id === id)) throw new Error('Trip not found');
  const trips = data.trips.map((trip) =>
    trip.id === id ? { ...trip, ...draft, destination, dates, custom: true as const } : trip,
  );
  return { ...data, trips, trip: trips.at(-1) ?? defaultHome.trip };
}

export function removeTrip(data: HomeData, id: string): HomeData {
  if (!data.trips.some((trip) => trip.id === id)) throw new Error('Trip not found');
  const trips = data.trips.filter((trip) => trip.id !== id);
  return { ...data, trips, trip: trips.at(-1) ?? defaultHome.trip };
}
