import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { useSavedPlaces } from '../ExploreScreen/useSavedPlaces';
import { googleMapsPlaceUrl } from '../ExploreScreen/mapLinks';
import type { Place } from '../ExploreScreen/ExploreScreen.data';
import type { GooglePlace } from '../../repositories/googlePlaces';
import { placePhotoRepository, type PlacePhoto } from '../../repositories/placePhotos';
import { placeSummaryRepository, type PlaceSummary } from '../../repositories/placeSummaries';
import { storage, storageKeys } from '../../storage';
import { decodePlaceRatings } from '../../models/placeRatings';
import { placeTypeLabel } from '../../models/placeType';

export type DetailPlace = GooglePlace | Place;

type Props = {
  place: DetailPlace;
  onClose: () => void;
  onAddToJournal: () => void;
};

function isGooglePlace(place: DetailPlace): place is GooglePlace {
  return 'countryCode' in place;
}

function fallback(type: string) {
  if (type.includes('museum') || type.includes('gallery') || type === 'Müzeler')
    return require('../../../assets/explore/gallery.jpg');
  if (type.includes('restaurant') || type.includes('cafe') || type === 'Gastronomi')
    return require('../../../assets/explore/restaurant.jpg');
  return require('../../../assets/trips/coast.jpg');
}

export function PlaceDetailScreen({ place, onClose, onAddToJournal }: Props) {
  const google = isGooglePlace(place);
  const address = google ? place.address : place.location;
  const category = google ? placeTypeLabel(place.type) : place.tag;
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [summary, setSummary] = useState<PlaceSummary | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingReady, setRatingReady] = useState(false);
  const [ratingError, setRatingError] = useState('');
  const { saved, ready, error: saveError, toggle } = useSavedPlaces();
  const isSaved = saved.includes(place.id);

  useEffect(() => {
    let active = true;
    storage
      .get(storageKeys.placeRatings, {}, decodePlaceRatings)
      .then((ratings) => {
        if (active) setRating(ratings[place.id] ?? 0);
      })
      .catch(() => {
        if (active) setRatingError('Puanın okunamadı.');
      })
      .finally(() => {
        if (active) setRatingReady(true);
      });
    return () => {
      active = false;
    };
  }, [place.id]);

  useEffect(() => {
    if (!google) return;
    let active = true;
    const controller = new AbortController();
    void placePhotoRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setPhoto(value);
      })
      .catch(() => {});
    void placeSummaryRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setSummary(value);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [google, place.title, google ? place.countryCode : '']);

  async function rate(value: number) {
    if (!ratingReady) return;
    try {
      const ratings = await storage.update(
        storageKeys.placeRatings,
        {},
        decodePlaceRatings,
        (current) => ({
          ...current,
          [place.id]: value,
        }),
      );
      setRating(ratings[place.id]);
      setRatingError('');
    } catch {
      setRatingError('Puanın kaydedilemedi. Tekrar dene.');
    }
  }

  function open(url: string) {
    if (url.startsWith('https://')) void Linking.openURL(url);
  }

  const matched = google && !!photo && !imageFailed;
  const image = google ? (matched ? { uri: photo.url } : fallback(place.type)) : place.image;
  const mapsUrl = googleMapsPlaceUrl(
    google ? place.mapsUrl : undefined,
    `${place.title}, ${address}`,
  );
  const canOpenMap = google || place.mappable !== false;

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-[#F8F7F2]">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-9">
        <View className="flex-row items-center justify-between px-5 pb-3 pt-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Geri dön"
            onPress={onClose}
            className="h-11 w-11 items-center justify-center rounded-full bg-white"
          >
            <Feather name="arrow-left" size={19} color="#203E35" />
          </Pressable>
          <Text className="font-garamond text-[24px] text-[#203E35]">Wanderly</Text>
          <View className="h-11 w-11" />
        </View>
        <View className="mx-5 overflow-hidden rounded-[23px] bg-white">
          <Image
            source={image}
            onError={() => setImageFailed(true)}
            resizeMode="cover"
            accessibilityLabel={
              matched ? `${place.title} fotoğrafı` : google ? 'Temsili görsel' : place.title
            }
            className="h-[230px] w-full"
          />
          <View className="absolute bottom-3 left-3 rounded-full bg-[#F8F9F1E8] px-3 py-2">
            <Text className="font-manrope-semibold text-[9px] tracking-[1px] text-[#203E35]">
              {google && matched ? 'EŞLEŞEN FOTOĞRAF' : 'TEMSİLİ GÖRSEL'}
            </Text>
          </View>
        </View>
        <View className="px-6 pt-6">
          <Text className="font-manrope-semibold text-[9px] tracking-[2px] text-[#B66A50]">
            {category.toLocaleUpperCase('tr-TR')}
          </Text>
          <Text
            accessibilityRole="header"
            className="mt-2 font-garamond text-[36px] leading-[39px] text-[#203E35]"
          >
            {place.title}
          </Text>
          <Text className="mt-2 font-manrope text-[11px] leading-[18px] text-[#778078]">
            {address}
          </Text>
          {!google && (
            <>
              <View className="my-5 h-px bg-[#DFE3D9]" />
              <Text className="font-garamond text-[25px] text-[#203E35]">Mekânın hikâyesi</Text>
              <Text className="mt-2 font-manrope text-[12px] leading-[21px] text-[#53665B]">
                {place.description}
              </Text>
            </>
          )}
          {!!summary && (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`${place.title} Vikipedi özetini aç`}
              onPress={() => open(summary.sourceUrl)}
              className="mt-4 self-start flex-row items-center gap-1 py-2"
            >
              <Text className="font-manrope-semibold text-[11px] text-[#49644F] underline">
                Vikipedi özetini oku
              </Text>
              <Feather name="external-link" size={13} color="#49644F" />
            </Pressable>
          )}
          {matched && (
            <View className="mt-2 flex-row flex-wrap gap-3">
              <Pressable
                accessibilityRole="link"
                onPress={() => open(photo.sourceUrl)}
                className="py-2"
              >
                <Text className="font-manrope text-[9px] text-[#778078]">
                  Fotoğraf: {photo.author} ↗
                </Text>
              </Pressable>
            </View>
          )}
          {google &&
            place.attributions.map((attribution, index) => (
              <Pressable
                key={`${attribution.provider}-${index}`}
                accessibilityRole="link"
                onPress={() => open(attribution.providerUri)}
                className="py-1"
              >
                <Text className="font-manrope text-[9px] text-[#778078]">
                  {attribution.provider} ↗
                </Text>
              </Pressable>
            ))}
          <View className="my-5 h-px bg-[#DFE3D9]" />
          <Text className="font-garamond text-[25px] text-[#203E35]">Senin değerlendirmen</Text>
          <Text className="mt-1 font-manrope text-[10px] text-[#778078]">
            Kendi puanın bu cihazda saklanır; Google puanı değildir.
          </Text>
          <View className="mt-3 flex-row gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`${value} yıldız ver`}
                accessibilityState={{ selected: rating === value, disabled: !ratingReady }}
                disabled={!ratingReady}
                onPress={() => void rate(value)}
                className="h-11 w-11 items-center justify-center rounded-xl bg-white"
              >
                <Feather name="star" size={21} color={value <= rating ? '#BB8659' : '#B9C3B8'} />
              </Pressable>
            ))}
          </View>
          {!!ratingError && (
            <Text
              accessibilityRole="alert"
              className="mt-2 font-manrope text-[10px] text-[#A54839]"
            >
              {ratingError}
            </Text>
          )}
          {!!saveError && (
            <Text
              accessibilityRole="alert"
              className="mt-2 font-manrope text-[10px] text-[#A54839]"
            >
              {saveError}
            </Text>
          )}
          <View className="mt-7 gap-3">
            <Pressable
              accessibilityRole="button"
              onPress={onAddToJournal}
              className="min-h-12 flex-row items-center justify-center gap-2 rounded-xl bg-[#203E35] px-4"
            >
              <Feather name="book-open" size={15} color="white" />
              <Text className="font-manrope-semibold text-[11px] text-white">Günlüğe ekle</Text>
            </Pressable>
            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                disabled={!ready}
                onPress={() => void toggle(place.id)}
                className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#DCE4D8] bg-white px-3"
              >
                <Feather name="bookmark" size={15} color="#203E35" />
                <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                  {isSaved ? 'Kaydedildi' : 'Kaydet'}
                </Text>
              </Pressable>
              {canOpenMap && (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => open(mapsUrl)}
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border border-[#DCE4D8] bg-white px-3"
                >
                  <Feather name="map-pin" size={15} color="#203E35" />
                  <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                    Haritada aç
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
