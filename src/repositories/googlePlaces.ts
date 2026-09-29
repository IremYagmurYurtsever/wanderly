import { authController } from '../auth/runtime';
import { ApiError } from '../services/api/client';

export type GooglePlace = {
  id: string;
  title: string;
  address: string;
  type: string;
  countryCode: string;
  mapsUrl: string;
  attributions: { provider: string; providerUri: string }[];
};

export type Country = { code: string; label: string };

function decodePlaces(value: unknown): GooglePlace[] {
  if (!Array.isArray(value)) throw new ApiError('INVALID_RESPONSE');
  return value.filter(
    (place): place is GooglePlace =>
      !!place &&
      typeof place.id === 'string' &&
      typeof place.title === 'string' &&
      typeof place.address === 'string' &&
      typeof place.mapsUrl === 'string' &&
      typeof place.countryCode === 'string' &&
      Array.isArray(place.attributions),
  );
}

export const googlePlacesRepository = {
  async searchAny(query: string) {
    const result = await authController.request(
      `/api/places/search?query=${encodeURIComponent(query)}`,
    );
    return decodePlaces(result.items);
  },
  async countries(): Promise<Country[]> {
    const result = await authController.request('/api/places/countries');
    if (!Array.isArray(result.items)) throw new ApiError('INVALID_RESPONSE');
    return result.items.filter(
      (item): item is Country =>
        !!item && typeof item.code === 'string' && typeof item.label === 'string',
    );
  },
  async search(country: string, category: string, query: string) {
    const path = `/api/places/discover?country=${encodeURIComponent(country)}&category=${encodeURIComponent(category)}&query=${encodeURIComponent(query)}`;
    const result = await authController.request(path);
    return decodePlaces(result.items);
  },
  async saved(country: string) {
    const result = await authController.request(
      `/api/places/saved/details?country=${encodeURIComponent(country)}`,
    );
    return decodePlaces(result.items);
  },
};
