import { useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { defaultHome, type HomeData, type HomePreferences, type Trip } from '../../models/trip';
import { homeRepository } from '../../repositories';
import { homeQuery, useTripMutations } from '../../query/trips';
export type { Currency, HomeData } from '../../models/trip';

export function useHomeStorage() {
  const queryClient = useQueryClient();
  const home = useQuery(homeQuery);
  const mutations = useTripMutations();
  const [actionError, setActionError] = useState('');
  const saving = useRef(false);
  const active = useRef(true);

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const ready = !home.isPending;
  const storageError =
    actionError || (home.isError ? 'Planların okunamadı. Mevcut kayıtların korunuyor.' : '');

  function update(patch: Partial<HomePreferences>) {
    if (!ready) return;
    queryClient.setQueryData<HomeData>(homeQuery.queryKey, (current) => ({
      ...(current ?? defaultHome),
      ...patch,
    }));
    void homeRepository
      .updatePreferences(patch)
      .then(() => {
        if (active.current) setActionError('');
      })
      .catch(() => {
        if (active.current) setActionError('Değişiklikler kaydedilemedi. Lütfen yeniden dene.');
      });
  }

  async function addTrip(trip: Trip) {
    if (!ready || saving.current) return null;
    saving.current = true;
    try {
      const savedTrip = await mutations.addTrip(trip);
      if (active.current) setActionError('');
      return savedTrip;
    } catch {
      if (active.current)
        setActionError('Gezi kaydedilemedi. Önceki gezilerin korunuyor; tekrar deneyebilirsin.');
      return null;
    } finally {
      saving.current = false;
    }
  }

  async function editTrip(id: string, trip: Trip) {
    if (!ready || saving.current) return false;
    saving.current = true;
    try {
      await mutations.editTrip({ id, draft: trip });
      if (active.current) setActionError('');
      return true;
    } catch {
      if (active.current) setActionError('Gezi güncellenemedi. Lütfen yeniden dene.');
      return false;
    } finally {
      saving.current = false;
    }
  }

  async function deleteTrip(id: string) {
    if (!ready || saving.current) return false;
    saving.current = true;
    try {
      await mutations.deleteTrip(id);
      if (active.current) setActionError('');
      return true;
    } catch {
      if (active.current) setActionError('Gezi silinemedi. Lütfen yeniden dene.');
      return false;
    } finally {
      saving.current = false;
    }
  }

  return {
    data: home.data ?? defaultHome,
    update,
    addTrip,
    editTrip,
    deleteTrip,
    savingTrip: mutations.savingTrip,
    ready,
    storageError,
  };
}
