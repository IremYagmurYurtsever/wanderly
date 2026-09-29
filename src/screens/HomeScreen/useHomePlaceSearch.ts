import { useEffect, useRef, useState } from 'react';
import { decodeHomeSearch, emptyHomeSearch, withSearchResults } from '../../models/homeSearch';
import { googlePlacesRepository } from '../../repositories/googlePlaces';
import { ApiError } from '../../services/api/client';
import { storage, storageKeys } from '../../storage';

export function useHomePlaceSearch() {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState(emptyHomeSearch);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    active.current = true;
    storage
      .get(storageKeys.homeSearch, emptyHomeSearch, decodeHomeSearch)
      .then((value) => {
        if (!active.current) return;
        setHistory(value);
        setQuery(value.lastQuery);
      })
      .catch(() => {
        if (active.current) setError('Önceki aramaların yüklenemedi. Yeni arama yapabilirsin.');
      })
      .finally(() => {
        if (active.current) setReady(true);
      });
    return () => {
      active.current = false;
      requestId.current += 1;
    };
  }, []);

  function changeQuery(value: string) {
    requestId.current += 1;
    setBusy(false);
    setError('');
    setQuery(value);
  }

  async function search(term: string) {
    const trimmed = term.trim();
    setQuery(term);
    if (trimmed.length < 1) {
      setError('Bir mekân veya restoran adı yaz.');
      return;
    }
    const currentRequest = ++requestId.current;
    setBusy(true);
    setError('');
    try {
      const results = await googlePlacesRepository.searchAny(trimmed);
      if (!active.current || currentRequest !== requestId.current) return;
      const next = withSearchResults(history, trimmed, results);
      setHistory(next);
      try {
        await storage.set(storageKeys.homeSearch, next);
      } catch {
        if (active.current && currentRequest === requestId.current)
          setError('Sonuçlar gösteriliyor ancak arama geçmişin kaydedilemedi.');
      }
    } catch (reason) {
      if (!active.current || currentRequest !== requestId.current) return;
      setError(
        reason instanceof ApiError && reason.code === 'GOOGLE_KEY_MISSING'
          ? 'Mekân araması için Google API anahtarı backend’de ayarlanmalı.'
          : 'Mekânlar yüklenemedi. Bağlantını ve Google API ayarlarını kontrol et.',
      );
    } finally {
      if (active.current && currentRequest === requestId.current) setBusy(false);
    }
  }

  return { query, changeQuery, history, ready, busy, error, search };
}
