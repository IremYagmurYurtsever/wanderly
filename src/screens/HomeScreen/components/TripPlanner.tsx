import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { TripCountryPicker } from '../../../components/TripCountryPicker';
import { TripDatePicker } from '../../../components/TripDatePicker';
import { formatTripDates, todayIso, validIsoDate } from '../../../models/tripDates';
import type { Country } from '../../../repositories/googlePlaces';
import { countriesQuery } from '../../../query/places';
import { palette, styles } from '../HomeScreen.styles';
import type { Trip } from '../HomeScreen.types';
import type { HomeData, HomePreferences } from '../../../models/trip';

const fallbackCountries: Country[] = [
  { code: 'IT', label: 'İtalya' },
  { code: 'TR', label: 'Türkiye' },
  { code: 'FR', label: 'Fransa' },
];

export function TripPlanner({
  onPlan,
  searching,
  data,
  update,
  busy,
}: {
  busy: boolean;
  onPlan: (trip: Trip) => void;
  searching: number;
  data: HomeData;
  update: (patch: Partial<HomePreferences>) => void;
}) {
  const { countryCode, startDate, endDate } = data;
  const countryList = useQuery(countriesQuery);
  const countries = countryList.data?.length ? countryList.data : fallbackCountries;
  const [countryOpen, setCountryOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (searching > 0) setCountryOpen(true);
  }, [searching]);
  const countryName = countries.find((item) => item.code === countryCode)?.label ?? countryCode;

  function plan() {
    if (busy) return;
    if (
      !validIsoDate(startDate) ||
      !validIsoDate(endDate) ||
      startDate < todayIso() ||
      endDate < startDate
    ) {
      setError('Takvimden geçerli gidiş ve dönüş günlerini seç.');
      return;
    }
    const country = countries.find((item) => item.code === countryCode);
    if (!country) {
      setError('Listeden bir ülke seç.');
      return;
    }
    setError('');
    onPlan({
      destination: country.label,
      dates: formatTripDates(startDate, endDate),
      countryCode,
      startDate,
      endDate,
      custom: true,
      stops: [],
    });
  }

  return (
    <View className={styles.card}>
      <View className={styles.between}>
        <View className={[styles.row, '!gap-[6px]'].filter(Boolean).join(' ')}>
          <View className="h-[4px] w-[4px] rounded-[2px] bg-[#BD7C61]" />
          <Text className={[styles.label, '!text-[8px]'].filter(Boolean).join(' ')}>
            YOLCULUK PLANLAYICI
          </Text>
        </View>
        <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
          Bir hayalle başlar
        </Text>
      </View>
      <Text
        className={[styles.title, '!mb-[15px] !mt-[10px] !text-[23px]'].filter(Boolean).join(' ')}
      >
        Yeni bir yolculuk planla
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Ülke seç: ${countryName}`}
        onPress={() => setCountryOpen(true)}
        className={`${styles.field} mb-2`}
      >
        <Feather name="globe" size={16} color="#91A18F" />
        <View className="flex-1">
          <Text className={[styles.label, '!mb-[4px] !text-[7px]'].filter(Boolean).join(' ')}>
            ÜLKE
          </Text>
          <Text className={styles.input}>{countryName}</Text>
        </View>
        <Feather name="chevron-down" size={15} color={palette.green} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Gidiş ve dönüş tarihlerini takvimden seç"
        onPress={() => setCalendarOpen(true)}
        className={styles.field}
      >
        <Feather name="calendar" size={16} color="#91A18F" />
        <View className="flex-1">
          <Text className={[styles.label, '!mb-[4px] !text-[7px]'].filter(Boolean).join(' ')}>
            GİDİŞ · DÖNÜŞ
          </Text>
          <Text className={styles.input}>
            {startDate && endDate ? formatTripDates(startDate, endDate) : 'Takvimden tarih seç'}
          </Text>
        </View>
        <Feather name="chevron-right" size={15} color={palette.green} />
      </Pressable>
      {!!error && (
        <Text accessibilityRole="alert" className="mt-2 font-manrope text-[10px] text-[#A54839]">
          {error}
        </Text>
      )}
      <Pressable
        accessibilityRole="button"
        disabled={busy}
        onPress={plan}
        className={`${styles.button} mt-3 self-end !min-h-[40px] !px-[13px]`}
      >
        <Text className={styles.buttonText}>{busy ? 'Kaydediliyor…' : 'Planla'}</Text>
        <Feather name="arrow-right" size={13} color="white" />
      </Pressable>
      <TripCountryPicker
        visible={countryOpen}
        countries={countries}
        onClose={() => setCountryOpen(false)}
        onSelect={(country) => update({ countryCode: country.code })}
      />
      <TripDatePicker
        visible={calendarOpen}
        startDate={startDate}
        endDate={endDate}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(start, end) =>
          update({ startDate: start, endDate: end, dates: formatTripDates(start, end) })
        }
      />
    </View>
  );
}
