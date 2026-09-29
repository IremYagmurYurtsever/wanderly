import { AuthError } from '../auth/validation.js';
import type { countries } from './countries.js';

const fields =
  'places.id,places.displayName,places.formattedAddress,places.addressComponents,places.primaryType,places.googleMapsUri,places.attributions';
type Country = (typeof countries)[number];
export type GooglePlace = {
  id: string;
  title: string;
  address: string;
  type: string;
  countryCode: string;
  mapsUrl: string;
  attributions: { provider: string; providerUri: string }[];
};
type RawPlace = {
  id?: unknown;
  displayName?: { text?: unknown };
  formattedAddress?: unknown;
  primaryType?: unknown;
  addressComponents?: { types?: unknown; shortText?: unknown }[];
  googleMapsUri?: unknown;
  attributions?: { provider?: unknown; providerUri?: unknown }[];
};

function normalize(value: RawPlace): GooglePlace | null {
  if (
    typeof value.id !== 'string' ||
    !value.id ||
    value.id.length > 512 ||
    typeof value.displayName?.text !== 'string' ||
    !value.displayName.text.trim()
  )
    return null;
  const mapsUrl =
    typeof value.googleMapsUri === 'string' && value.googleMapsUri.startsWith('https://')
      ? value.googleMapsUri
      : `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(value.id)}`;
  return {
    id: value.id,
    title: value.displayName.text,
    address: typeof value.formattedAddress === 'string' ? value.formattedAddress : '',
    type: typeof value.primaryType === 'string' ? value.primaryType : '',
    countryCode: Array.isArray(value.addressComponents)
      ? String(
          value.addressComponents.find(
            (entry) => Array.isArray(entry.types) && entry.types.includes('country'),
          )?.shortText ?? '',
        )
      : '',
    mapsUrl,
    attributions: Array.isArray(value.attributions)
      ? value.attributions
          .filter((entry) => typeof entry.provider === 'string')
          .map((entry) => ({
            provider: String(entry.provider),
            providerUri: typeof entry.providerUri === 'string' ? entry.providerUri : '',
          }))
      : [],
  };
}

export function createGooglePlacesService(
  apiKey: string | undefined,
  fetcher: typeof fetch = fetch,
) {
  async function request(path: string, body?: object) {
    if (!apiKey?.trim())
      throw new AuthError(503, 'GOOGLE_KEY_MISSING', 'Google Demo Key henüz ayarlanmadı.');
    let response: Response;
    try {
      response = await fetcher(`https://places.googleapis.com/v1/${path}`, {
        method: body ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': body ? fields : fields.replaceAll('places.', ''),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(8000),
      });
    } catch {
      throw new AuthError(503, 'GOOGLE_UNAVAILABLE', 'Google mekanları şu an yüklenemiyor.');
    }
    if (response.status === 400 && (await response.text()).includes('API key not valid'))
      throw new AuthError(503, 'GOOGLE_KEY_INVALID', 'Google mekân anahtarı geçersiz.');
    if (!response.ok)
      throw new AuthError(
        response.status === 429 || response.status === 403 ? 503 : 502,
        'GOOGLE_UNAVAILABLE',
        'Google Demo Key sınırı veya bağlantısı kontrol edilmeli.',
      );
    return response.json() as Promise<Record<string, unknown>>;
  }
  return {
    async searchAny(query: string) {
      const result = await request('places:searchText', {
        textQuery: query,
        languageCode: 'tr',
        pageSize: 10,
      });
      return Array.isArray(result.places)
        ? result.places
            .map((value) => normalize(value as RawPlace))
            .filter((value): value is GooglePlace => !!value && !!value.countryCode)
        : [];
    },
    async search(country: Country, category: string, query: string) {
      const subject =
        query ||
        (category === 'museums'
          ? 'museums'
          : category === 'food'
            ? 'restaurants'
            : category === 'parks'
              ? 'parks'
              : category === 'hotels'
                ? 'hotels'
                : 'places to visit');
      const result = await request('places:searchText', {
        textQuery: `${subject} in ${country.name}`,
        regionCode: country.code,
        languageCode: 'tr',
        pageSize: 20,
      });
      return Array.isArray(result.places)
        ? result.places
            .map((value) => normalize(value as RawPlace))
            .filter((value): value is GooglePlace => !!value && value.countryCode === country.code)
            .slice(0, 10)
        : [];
    },
    async details(id: string) {
      const result = await request(`places/${encodeURIComponent(id)}`);
      return normalize(result as RawPlace);
    },
  };
}
export type GooglePlacesService = ReturnType<typeof createGooglePlacesService>;
