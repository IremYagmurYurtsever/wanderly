import { useQuery } from '@tanstack/react-query';
import type { Journey } from './TripsScreen.types';
import { tripTiming } from '../../models/tripDates';
import { homeQuery } from '../../query/trips';

export function useTrips() {
  const home = useQuery(homeQuery);
  const items: Journey[] = (home.data?.trips ?? [])
    .map((trip) => {
      const timing = tripTiming(trip);
      return {
        id: trip.id,
        title: trip.destination,
        location: trip.destination,
        dates: trip.dates,
        status: timing.status,
        duration:
          timing.status === 'upcoming' && timing.days !== null
            ? `${timing.days} gün kaldı`
            : timing.status === 'ongoing'
              ? timing.days === 0
                ? 'Bugün dönüş günü'
                : `Dönüşe ${timing.days} gün`
              : timing.status === 'past'
                ? 'Tamamlandı'
                : 'Tarih ekle',
        trip,
      };
    })
    .sort((first, second) => {
      return (first.trip.startDate ?? '').localeCompare(second.trip.startDate ?? '');
    });

  return {
    items,
    error: home.isError ? 'Geziler sunucudan alınamadı. Bağlantını kontrol et.' : '',
    loading: home.isPending,
  };
}
