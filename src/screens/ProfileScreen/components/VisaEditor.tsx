import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import Feather from '@expo/vector-icons/Feather';
import { AppModal } from '../../../components/AppModal';
import type { Country } from '../../../repositories/googlePlaces';
import { todayIso, validIsoDate } from '../../../models/tripDates';
import type { Visa, VisaDraft } from '../../../models/visa';

type Props = {
  visa?: Visa;
  countries: Country[];
  onClose: () => void;
  onSave: (draft: VisaDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function VisaEditor({ visa, countries, onClose, onSave, onDelete }: Props) {
  const [countryCode, setCountryCode] = useState(visa?.countryCode ?? '');
  const [countryOpen, setCountryOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [validFrom, setValidFrom] = useState(visa?.validFrom ?? todayIso());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [duration, setDuration] = useState(String(visa?.durationDays ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const country = countries.find((item) => item.code === countryCode);
  const visibleCountries = countries.filter((item) =>
    item.label.toLocaleLowerCase('tr-TR').includes(countrySearch.trim().toLocaleLowerCase('tr-TR')),
  );

  async function save() {
    const durationDays = Number(duration);
    if (
      !countryCode ||
      !validIsoDate(validFrom) ||
      !Number.isInteger(durationDays) ||
      durationDays < 1 ||
      durationDays > 3650
    ) {
      setError('Ülke, başlangıç tarihi ve 1–3650 gün arasında geçerli bir süre seç.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSave({ countryCode, validFrom, durationDays });
    } catch {
      setError('Vize kaydı kaydedilemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!onDelete) return;
    setBusy(true);
    setError('');
    try {
      await onDelete();
    } catch {
      setError('Vize kaydı silinemedi. Lütfen tekrar dene.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppModal
      title={visa ? 'Vize kaydını düzenle' : 'Yeni vize kaydı'}
      busy={busy}
      onClose={onClose}
    >
      <Text className="mb-4 font-manrope text-[11px] leading-5 text-[#77856D]">
        Bu kişisel bir hatırlatıcıdır; resmi vize geçerliliğini belgen üzerinden kontrol et.
      </Text>
      <Text className="mb-2 font-manrope-semibold text-[9px] tracking-wider text-[#8B9389]">
        ÜLKE
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => setCountryOpen(!countryOpen)}
        className="mb-3 min-h-11 flex-row items-center justify-between rounded-xl border border-[#E7E8DF] bg-white px-4"
      >
        <Text className="font-manrope text-[12px] text-[#203E35]">
          {country?.label ?? 'Ülke seç'}
        </Text>
        <Feather name="chevron-down" size={16} color="#203E35" />
      </Pressable>
      {countryOpen && (
        <View className="mb-3 rounded-xl border border-[#E7E8DF] bg-white p-2">
          <TextInput
            accessibilityLabel="Vize ülkesi ara"
            value={countrySearch}
            onChangeText={setCountrySearch}
            placeholder="Ülke ara"
            className="rounded-lg bg-[#F7F7F2] px-3 py-2 font-manrope text-[11px] text-[#203E35]"
          />
          <ScrollView
            className="max-h-[170px]"
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {visibleCountries.map((item) => (
              <Pressable
                key={item.code}
                accessibilityRole="button"
                onPress={() => {
                  setCountryCode(item.code);
                  setCountryOpen(false);
                  setCountrySearch('');
                }}
                className="border-b border-[#F0F0E8] px-3 py-2"
              >
                <Text className="font-manrope text-[11px] text-[#203E35]">{item.label}</Text>
              </Pressable>
            ))}
            {visibleCountries.length === 0 && (
              <Text className="p-3 font-manrope text-[11px] text-[#8B9389]">Ülke bulunamadı.</Text>
            )}
          </ScrollView>
        </View>
      )}
      <Text className="mb-2 font-manrope-semibold text-[9px] tracking-wider text-[#8B9389]">
        GEÇERLİLİK BAŞLANGICI
      </Text>
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={() => setCalendarOpen(!calendarOpen)}
        className="mb-3 min-h-11 flex-row items-center justify-between rounded-xl border border-[#E7E8DF] bg-white px-4"
      >
        <Text className="font-manrope text-[12px] text-[#203E35]">{validFrom}</Text>
        <Feather name="calendar" size={16} color="#203E35" />
      </Pressable>
      {calendarOpen && (
        <Calendar
          current={validFrom}
          onDayPress={(day) => {
            setValidFrom(day.dateString);
            setCalendarOpen(false);
          }}
          enableSwipeMonths
          theme={{
            calendarBackground: '#F8F7F2',
            todayTextColor: '#B66A50',
            arrowColor: '#203E35',
            monthTextColor: '#203E35',
          }}
        />
      )}
      <Text className="mb-2 font-manrope-semibold text-[9px] tracking-wider text-[#8B9389]">
        VERİLEN SÜRE (GÜN)
      </Text>
      <TextInput
        accessibilityLabel="Vize süresi gün"
        editable={!busy}
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="Örn. 90"
        className="mb-3 rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[12px] text-[#203E35]"
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
        className="min-h-11 items-center justify-center rounded-xl bg-[#203E35]"
      >
        <Text className="font-manrope-semibold text-[11px] text-white">
          {busy ? 'İşleniyor…' : 'Kaydet'}
        </Text>
      </Pressable>
      {visa && onDelete && (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => setConfirmDelete(!confirmDelete)}
          className="mt-3 items-center py-2"
        >
          <Text className="font-manrope text-[10px] text-[#A54839]">
            {confirmDelete ? 'Silmeyi iptal et' : 'Kaydı sil'}
          </Text>
        </Pressable>
      )}
      {confirmDelete && (
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void remove()}
          className="items-center rounded-xl bg-[#A54839] p-3"
        >
          <Text className="font-manrope-semibold text-[11px] text-white">
            Evet, vize kaydını sil
          </Text>
        </Pressable>
      )}
    </AppModal>
  );
}
