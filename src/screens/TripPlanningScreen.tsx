import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { TripCountryPicker } from '../components/TripCountryPicker';
import { TripDatePicker } from '../components/TripDatePicker';
import { TripSuggestionCard } from '../components/TripSuggestionCard';
import { formatTripDates, resolveTripDates, validIsoDate } from '../models/tripDates';
import type { SavedTrip, Trip, TripStop } from '../models/trip';
import { tripCountryCode } from '../models/tripCover';
import {
  googlePlacesRepository,
  type Country,
  type GooglePlace,
} from '../repositories/googlePlaces';
import { countriesQuery } from '../query/places';
import { homeQuery, useTripMutations } from '../query/trips';
import { googleMapsPlaceUrl } from './ExploreScreen/mapLinks';

type Props = {
  trip?: SavedTrip;
  onClose: () => void;
  onDeleted: () => void;
  onSaved: () => void;
  onOpenPlace: (place: GooglePlace) => void;
};

const currencies = [
  { code: 'TRY', label: 'Türk lirası' },
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'ABD doları' },
  { code: 'GBP', label: 'İngiliz sterlini' },
  { code: 'JPY', label: 'Japon yeni' },
];

const fallbackCountries: Country[] = [
  { code: 'IT', label: 'İtalya' },
  { code: 'TR', label: 'Türkiye' },
];

function initialDraft(trip?: SavedTrip): Trip {
  if (!trip)
    return {
      destination: '',
      dates: '',
      countryCode: '',
      startDate: '',
      endDate: '',
      budget: '',
      currency: 'TRY',
      notes: '',
      stops: [],
      custom: true,
    };
  const resolvedDates = resolveTripDates(trip);
  return {
    destination: trip.destination,
    dates: trip.dates,
    countryCode: tripCountryCode(trip) ?? '',
    startDate: resolvedDates?.startDate ?? '',
    endDate: resolvedDates?.endDate ?? '',
    budget: trip.budget ?? '',
    currency: trip.currency ?? 'TRY',
    notes: trip.notes ?? '',
    stops: trip.stops ?? [],
    custom: true,
  };
}

export function TripPlanningScreen({ trip, onClose, onDeleted, onSaved, onOpenPlace }: Props) {
  const scroll = useRef<ScrollView>(null);
  const notesFocused = useRef(false);
  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (notesFocused.current) scroll.current?.scrollToEnd({ animated: true });
    });
    return () => subscription.remove();
  }, []);
  const tripMutations = useTripMutations();
  const home = useQuery(homeQuery);
  const [draft, setDraft] = useState<Trip>(() => initialDraft(trip));
  useEffect(() => {
    if (trip || !home.data) return;
    setDraft((current) =>
      current.countryCode || current.startDate || current.endDate
        ? current
        : {
            ...current,
            countryCode: home.data.countryCode,
            destination: home.data.destination,
            startDate: home.data.startDate,
            endDate: home.data.endDate,
            dates:
              home.data.startDate && home.data.endDate
                ? formatTripDates(home.data.startDate, home.data.endDate)
                : '',
          },
    );
  }, [trip, home.data]);
  const countryList = useQuery(countriesQuery);
  const countries = countryList.data?.length ? countryList.data : fallbackCountries;
  const [countryOpen, setCountryOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stops = draft.stops ?? [];
  const hotels = stops.filter((stop) => stop.kind === 'hotel');
  const places = stops.filter((stop) => stop.kind === 'place');
  const countryName =
    countries.find((item) => item.code === draft.countryCode)?.label ?? 'Ülke seç';
  const recommendationsReady = !!draft.countryCode;
  const countryCode = draft.countryCode ?? '';
  const hotelSuggestions = useQuery({
    queryKey: ['places', 'recommendations', countryCode, 'hotels'],
    queryFn: () => googlePlacesRepository.search(countryCode, 'hotels', ''),
    enabled: recommendationsReady,
    select: (items) => items.slice(0, 5),
  });
  const placeSuggestions = useQuery({
    queryKey: ['places', 'recommendations', countryCode, 'all'],
    queryFn: () => googlePlacesRepository.search(countryCode, 'all', ''),
    enabled: recommendationsReady,
    select: (items) => items.slice(0, 5),
  });
  const recommendedHotels = hotelSuggestions.data ?? [];
  const recommendedPlaces = placeSuggestions.data ?? [];
  const recommendationsLoading =
    recommendationsReady && (hotelSuggestions.isPending || placeSuggestions.isPending);
  const recommendationsError =
    hotelSuggestions.isError || placeSuggestions.isError
      ? 'Bazı öneriler yüklenemedi. Yeniden deneyebilirsin.'
      : '';

  function patch(changes: Partial<Trip>) {
    setDraft((current) => ({ ...current, ...changes }));
  }

  function select(place: GooglePlace, kind: 'hotel' | 'place') {
    if (kind === 'hotel' && hotels.length >= 10) {
      setError('En fazla 10 konaklama ekleyebilirsin.');
      return;
    }
    if (kind === 'place' && places.length >= 30) {
      setError('En fazla 30 gezilecek yer ekleyebilirsin.');
      return;
    }
    const stop: TripStop = {
      kind,
      placeId: place.id,
      title: place.title,
      address: place.address,
      mapsUrl: googleMapsPlaceUrl(place.mapsUrl, `${place.title}, ${place.address}`),
    };
    if (!stops.some((item) => item.kind === kind && item.placeId === place.id))
      patch({ stops: [...stops, stop] });
    setError('');
  }

  async function save() {
    if (saving) return;
    const country = countries.find((item) => item.code === draft.countryCode);
    const startDate = draft.startDate ?? '';
    const endDate = draft.endDate ?? '';
    const budget = draft.budget?.trim() ?? '';
    if (!country) {
      setError('Listeden bir ülke seç.');
      return;
    }
    if (!validIsoDate(startDate) || !validIsoDate(endDate) || endDate < startDate) {
      setError('Takvimden gidiş ve dönüş günlerini seç.');
      return;
    }
    if (
      budget &&
      (!/^\d+(?:[.,]\d{1,2})?$/.test(budget) || Number(budget.replace(',', '.')) <= 0)
    ) {
      setError('Bütçeyi pozitif bir sayı olarak yaz.');
      return;
    }
    if (places.length > 30) {
      setError('En fazla 30 gezilecek yer ekleyebilirsin.');
      return;
    }
    if (hotels.length > 10) {
      setError('En fazla 10 konaklama ekleyebilirsin.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const next: Trip = {
        destination: country.label,
        dates: formatTripDates(startDate, endDate),
        countryCode: draft.countryCode,
        startDate,
        endDate,
        budget: budget.replace(',', '.'),
        currency: draft.currency ?? 'TRY',
        notes: draft.notes?.trim() ?? '',
        stops,
        custom: true,
      };
      if (trip) await tripMutations.editTrip({ id: trip.id, draft: next });
      else await tripMutations.addTrip(next);
      onSaved();
    } catch {
      setError('Plan kaydedilemedi. Değişikliklerin bu ekranda duruyor; yeniden dene.');
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (saving || !trip) return;
    setSaving(true);
    try {
      await tripMutations.deleteTrip(trip.id);
      onDeleted();
    } catch {
      setError('Gezi silinemedi. Yeniden dene.');
      setSaving(false);
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#F8F7F2]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="px-5 pb-10"
        >
          <View className="flex-row items-center justify-between py-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Gezi ekranına dön"
              onPress={onClose}
              className="h-11 w-11 items-center justify-center rounded-full bg-white"
            >
              <Feather name="arrow-left" size={19} color="#203E35" />
            </Pressable>
            <Text className="font-garamond text-[24px] text-[#203E35]">Wanderly</Text>
            <View className="h-11 w-11" />
          </View>
          <Text className="mt-4 font-manrope-semibold text-[9px] tracking-[1.6px] text-[#B66A50]">
            SANA ÖZEL ROTA
          </Text>
          <Text
            accessibilityRole="header"
            className="mt-1 font-garamond text-[34px] text-[#203E35]"
          >
            Yolculuğunu şekillendir
          </Text>
          <Text className="mt-7 font-garamond text-[25px] text-[#203E35]">Rota ve tarihler</Text>
          <View className="mt-3 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              onPress={() => setCountryOpen(true)}
              className="min-h-12 flex-1 flex-row items-center justify-between rounded-xl border border-[#E7E8DF] bg-white px-3"
            >
              <Text className="font-manrope text-[11px] text-[#203E35]">{countryName}</Text>
              <Feather name="chevron-down" size={14} color="#526A50" />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => setCalendarOpen(true)}
              className="min-h-12 flex-1 flex-row items-center justify-between rounded-xl border border-[#E7E8DF] bg-white px-3"
            >
              <Text numberOfLines={1} className="flex-1 font-manrope text-[10px] text-[#203E35]">
                {draft.startDate && draft.endDate ? draft.dates : 'Gidiş · Dönüş'}
              </Text>
              <Feather name="calendar" size={14} color="#526A50" />
            </Pressable>
          </View>
          <Text className="mt-7 font-garamond text-[25px] text-[#203E35]">Konaklama</Text>
          {!!recommendationsError && (
            <View className="mt-3 flex-row items-center justify-between rounded-xl bg-[#F7EDE8] p-3">
              <Text className="flex-1 font-manrope text-[9px] text-[#A54839]">
                {recommendationsError}
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  void hotelSuggestions.refetch();
                  void placeSuggestions.refetch();
                }}
                className="ml-2 p-2"
              >
                <Text className="font-manrope-semibold text-[9px] text-[#A54839]">Tekrar dene</Text>
              </Pressable>
            </View>
          )}
          <View className="mt-3" />
          {recommendationsLoading ? (
            <Text className="font-manrope text-[10px] text-[#778078]">Öneriler yükleniyor…</Text>
          ) : recommendedHotels.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="pr-2"
            >
              {recommendedHotels.map((place) => (
                <TripSuggestionCard
                  key={place.id}
                  place={place}
                  selected={hotels.some((stop) => stop.placeId === place.id)}
                  onOpen={() => onOpenPlace(place)}
                  onAdd={() => select(place, 'hotel')}
                />
              ))}
            </ScrollView>
          ) : (
            <Text className="font-manrope text-[10px] text-[#778078]">
              Bu ülkede konaklama önerisi bulunamadı. Bir süre sonra yeniden deneyebilirsin.
            </Text>
          )}
          {hotels.map((hotel) => (
            <View
              key={hotel.placeId}
              className="mt-3 flex-row items-center rounded-xl border border-[#E7E8DF] bg-white p-3"
            >
              <Feather name="home" size={17} color="#526A50" />
              <View className="ml-3 flex-1">
                <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                  {hotel.title}
                </Text>
                <Text className="font-manrope text-[9px] text-[#778078]">{hotel.address}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${hotel.title} haritada aç`}
                onPress={() => void Linking.openURL(hotel.mapsUrl)}
                className="p-2"
              >
                <Feather name="map-pin" size={16} color="#526A50" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${hotel.title} konaklamasını kaldır`}
                onPress={() =>
                  patch({
                    stops: stops.filter(
                      (item) => item.kind !== 'hotel' || item.placeId !== hotel.placeId,
                    ),
                  })
                }
                className="p-2"
              >
                <Feather name="x" size={16} color="#A54839" />
              </Pressable>
            </View>
          ))}
          <Text className="mt-7 font-garamond text-[25px] text-[#203E35]">Gezilecek yerler</Text>
          <View className="mt-3" />
          {recommendationsLoading ? (
            <Text className="font-manrope text-[10px] text-[#778078]">Öneriler yükleniyor…</Text>
          ) : recommendedPlaces.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="pr-2"
            >
              {recommendedPlaces.map((place) => (
                <TripSuggestionCard
                  key={place.id}
                  place={place}
                  selected={places.some((stop) => stop.placeId === place.id)}
                  onOpen={() => onOpenPlace(place)}
                  onAdd={() => select(place, 'place')}
                />
              ))}
            </ScrollView>
          ) : (
            <Text className="font-manrope text-[10px] text-[#778078]">
              Bu ülkede gezilecek yer önerisi bulunamadı. Bir süre sonra yeniden deneyebilirsin.
            </Text>
          )}
          {places.map((stop, index) => (
            <View
              key={stop.placeId}
              className="mt-2 flex-row items-center rounded-xl border border-[#E7E8DF] bg-white p-3"
            >
              <View className="h-7 w-7 items-center justify-center rounded-full bg-[#E9EEE4]">
                <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                  {index + 1}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                  {stop.title}
                </Text>
                <Text numberOfLines={1} className="font-manrope text-[9px] text-[#778078]">
                  {stop.address}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${stop.title} haritada aç`}
                onPress={() => void Linking.openURL(stop.mapsUrl)}
                className="p-2"
              >
                <Feather name="map-pin" size={16} color="#526A50" />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${stop.title} kaldır`}
                onPress={() =>
                  patch({
                    stops: stops.filter(
                      (item) => item.placeId !== stop.placeId || item.kind !== 'place',
                    ),
                  })
                }
                className="p-2"
              >
                <Feather name="x" size={16} color="#A54839" />
              </Pressable>
            </View>
          ))}
          <Text className="mt-7 font-garamond text-[25px] text-[#203E35]">Bütçe ve notlar</Text>
          <View className="mt-3 flex-row gap-2">
            <TextInput
              accessibilityLabel="Planlanan bütçe"
              keyboardType="decimal-pad"
              value={draft.budget ?? ''}
              onChangeText={(value) => patch({ budget: value })}
              placeholder="Örn. 2500"
              className="min-h-12 flex-1 rounded-xl border border-[#E7E8DF] bg-white px-4 font-manrope text-[12px] text-[#203E35]"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Para birimi seç"
              accessibilityState={{ expanded: currencyOpen }}
              onPress={() => {
                Keyboard.dismiss();
                setCurrencyOpen((value) => !value);
              }}
              className="min-h-12 w-[118px] flex-row items-center justify-between rounded-xl bg-[#E9EEE4] px-3"
            >
              <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                {draft.currency ?? 'TRY'}
              </Text>
              <Feather
                name={currencyOpen ? 'chevron-up' : 'chevron-down'}
                size={14}
                color="#203E35"
              />
            </Pressable>
          </View>
          {currencyOpen && (
            <View className="ml-auto mt-1 w-[118px] overflow-hidden rounded-xl border border-[#DCE4D8] bg-white">
              {currencies.map((currency) => (
                <Pressable
                  key={currency.code}
                  accessibilityRole="button"
                  accessibilityState={{ selected: draft.currency === currency.code }}
                  onPress={() => {
                    patch({ currency: currency.code });
                    setCurrencyOpen(false);
                  }}
                  className="min-h-11 justify-center border-b border-[#EFF0E9] px-3"
                >
                  <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                    {currency.code}
                  </Text>
                  <Text className="font-manrope text-[8px] text-[#778078]">{currency.label}</Text>
                </Pressable>
              ))}
            </View>
          )}
          <Text className="mb-2 mt-4 font-manrope-semibold text-[9px] tracking-[0.7px] text-[#49644F]">
            NOTLARIN
          </Text>
          <TextInput
            accessibilityLabel="Yolculuk notların"
            multiline
            textAlignVertical="top"
            onFocus={() => {
              notesFocused.current = true;
              if (Keyboard.isVisible()) scroll.current?.scrollToEnd({ animated: true });
            }}
            onBlur={() => {
              notesFocused.current = false;
            }}
            value={draft.notes ?? ''}
            onChangeText={(value) => patch({ notes: value })}
            maxLength={5000}
            placeholder="Yolculuğuna dair istediğin notları yaz…"
            className="min-h-[100px] rounded-xl border border-[#E7E8DF] bg-white p-4 font-manrope text-[11px] text-[#203E35]"
          />
          {!!error && (
            <Text
              accessibilityRole="alert"
              className="mt-4 font-manrope text-[11px] text-[#A54839]"
            >
              {error}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={() => void save()}
            className="mt-6 min-h-12 items-center justify-center rounded-xl bg-[#203E35]"
          >
            <Text className="font-manrope-semibold text-[12px] text-white">
              {saving ? 'Kaydediliyor…' : 'Planı kaydet'}
            </Text>
          </Pressable>
          {trip && (
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => setConfirmDelete((value) => !value)}
              className="mt-4 min-h-10 items-center justify-center"
            >
              <Text className="font-manrope text-[10px] text-[#A54839]">
                {confirmDelete ? 'Silmeyi iptal et' : 'Bu geziyi sil'}
              </Text>
            </Pressable>
          )}
          {trip && confirmDelete && (
            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void remove()}
              className="min-h-11 items-center justify-center rounded-xl bg-[#A54839]"
            >
              <Text className="font-manrope-semibold text-[11px] text-white">Evet, geziyi sil</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <TripCountryPicker
        visible={countryOpen}
        countries={countries}
        onClose={() => setCountryOpen(false)}
        onSelect={(country) => {
          patch({ countryCode: country.code, destination: country.label, stops: [] });
        }}
      />
      <TripDatePicker
        visible={calendarOpen}
        startDate={draft.startDate ?? ''}
        endDate={draft.endDate ?? ''}
        onClose={() => setCalendarOpen(false)}
        onConfirm={(start, end) =>
          patch({ startDate: start, endDate: end, dates: formatTripDates(start, end) })
        }
      />
    </SafeAreaView>
  );
}
