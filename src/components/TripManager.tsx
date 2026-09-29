import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { AppModal } from './AppModal';
import type { SavedTrip, Trip } from '../models/trip';
import { palette } from '../theme/tokens';

type Props = {
  trip: SavedTrip | null;
  busy: boolean;
  onClose: () => void;
  onSave: (id: string, draft: Trip) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
};

export function TripManager({ trip, busy, onClose, onSave, onDelete }: Props) {
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDestination(trip?.destination ?? '');
    setDates(trip?.dates ?? '');
    setConfirmDelete(false);
    setError('');
  }, [trip?.id, trip?.destination, trip?.dates]);

  async function save() {
    if (!trip || busy) return;
    const draft = { destination: destination.trim(), dates: dates.trim() };
    if (!draft.destination || !draft.dates) {
      setError('Rota ve tarihler boş bırakılamaz.');
      return;
    }
    if (draft.destination.length > 200 || draft.dates.length > 100) {
      setError('Rota en fazla 200, tarihler en fazla 100 karakter olmalı.');
      return;
    }
    setError('');
    if (await onSave(trip.id, draft)) onClose();
    else setError('Değişiklikler kaydedilemedi. Tekrar dene.');
  }

  async function remove() {
    if (!trip || busy) return;
    setError('');
    if (await onDelete(trip.id)) onClose();
    else setError('Gezi silinemedi. Tekrar dene.');
  }

  return (
    <AppModal visible={!!trip} title="Gezi planını düzenle" onClose={onClose} busy={busy}>
      <Text className="font-manrope-semibold text-[9px] tracking-[1.4px] text-[#8B9389]">
        GİDİLECEK YER
      </Text>
      <TextInput
        accessibilityLabel="Gezi rotası"
        value={destination}
        onChangeText={setDestination}
        maxLength={200}
        className="mb-4 mt-2 rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[13px] text-[#203E35]"
        placeholder="Şehir veya bölge"
        placeholderTextColor={palette.muted}
      />
      <Text className="font-manrope-semibold text-[9px] tracking-[1.4px] text-[#8B9389]">
        TARİHLER
      </Text>
      <TextInput
        accessibilityLabel="Gezi tarihleri"
        value={dates}
        onChangeText={setDates}
        maxLength={100}
        className="mb-4 mt-2 rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[13px] text-[#203E35]"
        placeholder="Örn. 4 Kas – 11 Kas 2026"
        placeholderTextColor={palette.muted}
      />
      {!!error && (
        <Text accessibilityRole="alert" className="mb-3 font-manrope text-[11px] text-[#A54839]">
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => void save()}
        className="min-h-[48px] items-center justify-center rounded-xl bg-[#203E35]"
      >
        <Text className="font-manrope-semibold text-[12px] text-white">
          {busy ? 'İşleniyor…' : 'Değişiklikleri kaydet'}
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => setConfirmDelete((value) => !value)}
        className="mt-4 min-h-[44px] items-center justify-center"
      >
        <Text className="font-manrope-semibold text-[11px] text-[#A54839]">
          {confirmDelete ? 'Silmeyi iptal et' : 'Bu geziyi sil'}
        </Text>
      </Pressable>
      {confirmDelete && (
        <View className="rounded-xl bg-[#F9E9E4] p-3">
          <Text className="mb-3 font-manrope text-[11px] leading-[17px] text-[#744336]">
            Bu gezi hesabından kalıcı olarak silinecek. Geziye bağlı anılar varsa gezi bağlantısı
            kaldırılır.
          </Text>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void remove()}
            className="min-h-[42px] items-center justify-center rounded-lg bg-[#A54839]"
          >
            <Text className="font-manrope-semibold text-[11px] text-white">Evet, geziyi sil</Text>
          </Pressable>
        </View>
      )}
    </AppModal>
  );
}
