import type { GooglePlace } from '../repositories/googlePlaces';

export type HomeSearchState = {
  queries: string[];
  lastQuery: string;
  results: GooglePlace[];
};

export const emptyHomeSearch: HomeSearchState = { queries: [], lastQuery: '', results: [] };

function isPlace(value: unknown): value is GooglePlace {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const place = value as Record<string, unknown>;
  return (
    typeof place.id === 'string' &&
    typeof place.title === 'string' &&
    typeof place.address === 'string' &&
    typeof place.type === 'string' &&
    typeof place.countryCode === 'string' &&
    typeof place.mapsUrl === 'string' &&
    Array.isArray(place.attributions) &&
    place.attributions.every(
      (item) =>
        item &&
        typeof item === 'object' &&
        typeof item.provider === 'string' &&
        typeof item.providerUri === 'string',
    )
  );
}

export function decodeHomeSearch(value: unknown): HomeSearchState {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid search history');
  const data = value as Record<string, unknown>;
  if (
    !Array.isArray(data.queries) ||
    data.queries.length > 8 ||
    !data.queries.every((query) => typeof query === 'string' && query.length <= 80) ||
    typeof data.lastQuery !== 'string' ||
    data.lastQuery.length > 80 ||
    !Array.isArray(data.results) ||
    data.results.length > 10 ||
    !data.results.every(isPlace)
  )
    throw new Error('Invalid search history');
  return data as HomeSearchState;
}

export function withSearchResults(
  current: HomeSearchState,
  query: string,
  results: GooglePlace[],
): HomeSearchState {
  const term = query.trim();
  if (term.length < 1 || term.length > 80) throw new Error('Invalid search query');
  return {
    queries: [
      term,
      ...current.queries.filter(
        (item) => item.toLocaleLowerCase('tr-TR') !== term.toLocaleLowerCase('tr-TR'),
      ),
    ].slice(0, 8),
    lastQuery: term,
    results: results.slice(0, 10),
  };
}
