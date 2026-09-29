import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { appendTrip, removeTrip, replaceTrip, type HomeData, type Trip } from '../models/trip';
import { homeRepository } from '../repositories';

export const homeQuery = queryOptions({
  queryKey: ['home'],
  queryFn: homeRepository.load,
});

export function useTripMutations() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: homeRepository.addTrip,
    onSuccess: (savedTrip) => {
      queryClient.setQueryData<HomeData>(homeQuery.queryKey, (current) =>
        current && !current.trips.some((trip) => trip.id === savedTrip.id)
          ? appendTrip(current, savedTrip, savedTrip.id)
          : current,
      );
      void queryClient.invalidateQueries({ queryKey: homeQuery.queryKey });
    },
  });

  const edit = useMutation({
    mutationFn: ({ id, draft }: { id: string; draft: Trip }) =>
      homeRepository.updateTrip(id, draft),
    onSuccess: (_result, { id, draft }) => {
      queryClient.setQueryData<HomeData>(homeQuery.queryKey, (current) =>
        current?.trips.some((trip) => trip.id === id) ? replaceTrip(current, id, draft) : current,
      );
      void queryClient.invalidateQueries({ queryKey: homeQuery.queryKey });
    },
  });

  const remove = useMutation({
    mutationFn: homeRepository.deleteTrip,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<HomeData>(homeQuery.queryKey, (current) =>
        current?.trips.some((trip) => trip.id === id) ? removeTrip(current, id) : current,
      );
      void queryClient.invalidateQueries({ queryKey: homeQuery.queryKey });
    },
  });

  return {
    addTrip: add.mutateAsync,
    editTrip: edit.mutateAsync,
    deleteTrip: remove.mutateAsync,
    savingTrip: add.isPending || edit.isPending || remove.isPending,
  };
}
