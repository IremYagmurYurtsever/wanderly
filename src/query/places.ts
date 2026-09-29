import { queryOptions } from '@tanstack/react-query';
import { googlePlacesRepository } from '../repositories/googlePlaces';

export const countriesQuery = queryOptions({
  queryKey: ['places', 'countries'],
  queryFn: googlePlacesRepository.countries,
  staleTime: 5 * 60_000,
});
