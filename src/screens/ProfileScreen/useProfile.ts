import { useEffect, useRef, useState } from 'react';
import { profileRepository } from '../../repositories';
import { defaultProfile, type Profile } from '../../models/profile';
import { ApiError } from '../../services/api/client';

export function useProfile(name: string) {
  const [profile, setProfile] = useState<Profile>(defaultProfile(name));
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const saving = useRef(false);

  useEffect(() => {
    let active = true;
    profileRepository
      .load()
      .then((value) => {
        if (active) setProfile(value);
      })
      .catch(() => {
        if (active) setError('Profil bilgileri okunamadı. Mevcut kayıtların değiştirilmedi.');
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  async function update(patch: Partial<Profile>) {
    if (!ready || saving.current) return false;
    saving.current = true;
    setBusy(true);
    try {
      const next = await profileRepository.update(patch);
      setProfile(next);
      setError('');
      return true;
    } catch {
      setError('Değişikliklerin kaydedilemedi. Lütfen yeniden dene.');
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function changeEmail(email: string, password: string) {
    if (!ready || saving.current) return 'Başka bir kayıt işlemi devam ediyor.';
    saving.current = true;
    setBusy(true);
    try {
      const next = await profileRepository.changeEmail(email, password);
      setProfile(next);
      setError('');
      return null;
    } catch (cause) {
      if (cause instanceof ApiError) {
        if (cause.code === 'INVALID_CREDENTIALS') return 'Mevcut şifren hatalı.';
        if (cause.code === 'EMAIL_IN_USE')
          return 'Bu e-posta adresi başka bir hesapta kullanılıyor.';
        if (cause.code === 'INVALID_EMAIL') return 'Geçerli bir e-posta adresi gir.';
        if (cause.code === 'RATE_LIMITED')
          return 'Çok fazla deneme yapıldı. Bir süre sonra tekrar dene.';
        if (cause.code === 'NETWORK_ERROR' || cause.code === 'TIMEOUT')
          return 'Sunucuya ulaşılamadı. Bağlantını kontrol et.';
      }
      return 'E-posta değiştirilemedi. Lütfen tekrar dene.';
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return { profile, ready, busy, error, update, changeEmail };
}
