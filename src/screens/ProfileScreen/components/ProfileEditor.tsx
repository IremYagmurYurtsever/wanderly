import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { AppModal } from '../../../components/AppModal';
import type { Profile } from '../../../models/profile';
import { palette, styles } from '../ProfileScreen.styles';

export type EditorMode = 'preferences' | 'currency';
type Props = {
  mode: EditorMode;
  profile: Profile;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => Promise<boolean>;
};

const interests = ['Yavaş seyahat', 'Mimari', 'Sanat', 'Yerel mutfak', 'Doğa', 'Butik konaklama'];
const currencies = [
  { code: 'TRY', label: 'Türk lirası (₺)' },
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'ABD doları ($)' },
  { code: 'GBP', label: 'İngiliz sterlini (£)' },
  { code: 'JPY', label: 'Japon yeni (¥)' },
];

export function ProfileEditor({ mode, profile, busy, onClose, onSave }: Props) {
  const [preferences, setPreferences] = useState(profile.preferences);
  const [currency, setCurrency] = useState(profile.currency);
  const [error, setError] = useState('');

  async function save() {
    if (busy) return;
    const patch = mode === 'preferences' ? { preferences } : { currency };
    if (await onSave(patch)) onClose();
    else setError('Kaydedilemedi. Lütfen tekrar dene.');
  }

  return (
    <AppModal
      title={mode === 'preferences' ? 'Seyahat tercihlerin' : 'Bütçe para birimin'}
      onClose={onClose}
      busy={busy}
    >
      {mode === 'preferences' ? (
        <>
          <Text className={[styles.small, '!mb-[16px]'].filter(Boolean).join(' ')}>
            Yolculuklarında sana ilham verenleri seç.
          </Text>
          <View className={[styles.row, '!flex-wrap !gap-[9px]'].filter(Boolean).join(' ')}>
            {interests.map((item) => (
              <Pressable
                key={item}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: preferences.includes(item) }}
                onPress={() =>
                  setPreferences((current) =>
                    current.includes(item)
                      ? current.filter((value) => value !== item)
                      : [...current, item],
                  )
                }
                className={`${styles.choice} ${preferences.includes(item) ? '!border-[#49644F] !bg-[#DCE7D2]' : ''}`}
              >
                <Text className={styles.text}>
                  {preferences.includes(item) ? '✓ ' : ''}
                  {item}
                </Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : (
        <>
          <Text className={[styles.small, '!mb-[13px]'].filter(Boolean).join(' ')}>
            Profilinde gösterilecek varsayılan bütçe para birimi. Ana sayfadaki kur hesaplayıcısının
            seçimleri ayrıdır.
          </Text>
          {currencies.map((item) => (
            <Pressable
              key={item.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: item.code === currency }}
              onPress={() => setCurrency(item.code)}
              className={`${styles.choice} ${styles.between} mb-2 ${currency === item.code ? '!bg-[#DCE7D2]' : ''}`}
            >
              <Text className={styles.text}>{item.label}</Text>
              {currency === item.code && <Feather name="check" size={16} color={palette.green} />}
            </Pressable>
          ))}
        </>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          className={[styles.text, '!text-[#A54839] !mt-[13px]'].filter(Boolean).join(' ')}
        >
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void save()}
        className={`${styles.button} mt-[22px] ${busy ? '!opacity-60' : ''}`}
      >
        <Text className={styles.buttonText}>
          {busy ? 'Kaydediliyor…' : 'Değişiklikleri kaydet'}
        </Text>
      </Pressable>
    </AppModal>
  );
}
