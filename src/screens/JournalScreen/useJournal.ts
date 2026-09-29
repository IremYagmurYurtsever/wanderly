import { useQuery } from '@tanstack/react-query';
import { memoryRepository } from '../../repositories';
import { storageKeys } from '../../storage';
import { useStoredSelection } from '../../hooks/useStoredSelection';
import { type JournalEntry } from './JournalScreen.data';
import { homeQuery } from '../../query/trips';

export function useJournal() {
  const memories = useQuery({
    queryKey: ['memories'],
    queryFn: memoryRepository.load,
  });
  const home = useQuery(homeQuery);
  const {
    saved: favorites,
    ready,
    error: favoriteError,
    toggle: toggleFavorite,
  } = useStoredSelection(storageKeys.journalFavorites);
  const entries: JournalEntry[] = [...(memories.data ?? [])].reverse().map((memory) => ({
    ...memory,
    title: memory.text.split('\n')[0].slice(0, 65),
    city: home.data?.trips.find((trip) => trip.id === memory.tripId)?.destination ?? 'Kişisel',
    date: memory.visitedAt || memory.createdAt,
    photos: memory.photoDataUrl ? [{ uri: memory.photoDataUrl }] : [],
  }));

  return {
    entries,
    trips: home.data?.trips ?? [],
    tripsLoading: home.isPending,
    favorites,
    ready,
    error: home.isError
      ? 'Gezilerin yüklenemedi. Bağlantını kontrol edip tekrar dene.'
      : memories.isError
        ? 'Anıların okunamadı. Kayıtların değiştirilmedi; tekrar yüklemeyi deneyebilirsin.'
        : favoriteError,
    refresh: async () => {
      await Promise.all([memories.refetch(), home.refetch()]);
    },
    toggleFavorite,
  };
}
