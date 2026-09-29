import { useEffect, useRef, useState } from 'react';
import { selectionRepository } from '../repositories';
import { useQueryClient } from '@tanstack/react-query';

export function useStoredSelection(key: string) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const saving = useRef(false);
  useEffect(() => {
    active.current = true;
    setReady(false);
    selectionRepository
      .load(key)
      .then((value) => {
        if (active.current) {
          setSaved(value);
          setError('');
        }
      })
      .catch(() => {
        if (active.current) setError('Kayıtların okunamadı. Mevcut verilerin değiştirilmedi.');
      })
      .finally(() => {
        if (active.current) setReady(true);
      });
    return () => {
      active.current = false;
    };
  }, [key]);
  async function toggle(id: string) {
    if (!ready || saving.current) return;
    saving.current = true;
    try {
      const selected = !saved.includes(id);
      await selectionRepository.set(key, id, selected);
      void queryClient.invalidateQueries({ queryKey: ['selection', key] });
      const next = selected ? [...saved, id] : saved.filter((item) => item !== id);
      if (active.current) {
        setSaved(next);
        setError('');
      }
    } catch {
      if (active.current) setError('Seçimin kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      saving.current = false;
    }
  }
  return { saved, ready, error, toggle };
}
