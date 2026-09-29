import type { Trip } from './trip';

const countryPhotoTitles: Record<string, string> = {
  TR: 'Istanbul skyline',
  IT: 'Colosseum',
  FR: 'Eiffel Tower',
  ES: 'Sagrada Familia',
  GR: 'Acropolis Athens',
  PT: 'Lisbon Portugal',
  GB: 'Tower Bridge London',
  DE: 'Brandenburg Gate',
  NL: 'Amsterdam canals',
  BE: 'Grand Place Brussels',
  CH: 'Matterhorn',
  AT: 'Vienna Austria',
  CZ: 'Prague Castle',
  HU: 'Budapest Parliament',
  HR: 'Dubrovnik Croatia',
  RS: 'Belgrade Serbia',
  AL: 'Albania',
  ME: 'Montenegro',
  MA: 'Marrakech Morocco',
  EG: 'Pyramids of Giza',
  AE: 'Burj Khalifa',
  TH: 'Wat Arun',
  JP: 'Mount Fuji',
  KR: 'Seoul South Korea',
  ID: 'Bali Indonesia',
  SG: 'Marina Bay Sands',
  IN: 'Taj Mahal',
  US: 'New York skyline',
  CA: 'Banff Canada',
  MX: 'Chichen Itza',
  BR: 'Christ the Redeemer',
  AR: 'Buenos Aires Argentina',
  AU: 'Sydney Opera House',
  NZ: 'Milford Sound New Zealand',
};

const legacyDestinations: { pattern: RegExp; countryCode: string }[] = [
  { pattern: /italya|italy|floransa|toskan|roma|rome/i, countryCode: 'IT' },
  { pattern: /fransa|france|paris/i, countryCode: 'FR' },
  { pattern: /isviçre|isvicre|switzerland|alpler|alps/i, countryCode: 'CH' },
  { pattern: /türkiye|turkiye|istanbul|kapadokya/i, countryCode: 'TR' },
  { pattern: /japonya|japan|kyoto|tokyo/i, countryCode: 'JP' },
];

export function tripCountryCode(trip: Pick<Trip, 'countryCode' | 'destination'>) {
  const destination = trip.destination.toLocaleLowerCase('tr-TR');
  return (
    trip.countryCode ??
    legacyDestinations.find(({ pattern }) => pattern.test(destination))?.countryCode ??
    null
  );
}

export function tripCoverSearch(trip: Pick<Trip, 'countryCode' | 'destination' | 'stops'>) {
  const countryCode = tripCountryCode(trip);
  if (!countryCode) return null;
  const countryTitle = countryPhotoTitles[countryCode] ?? trip.destination;
  const stopTitle = trip.stops?.find((stop) => stop.kind === 'place')?.title;
  return { countryCode, title: stopTitle ?? countryTitle, fallbackTitle: countryTitle };
}
