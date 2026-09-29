import Feather from '@expo/vector-icons/Feather';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import type { GooglePlace } from '../../../repositories/googlePlaces';
import { placePhotoRepository, type PlacePhoto } from '../../../repositories/placePhotos';
import { placeSummaryRepository, type PlaceSummary } from '../../../repositories/placeSummaries';
import { styles } from '../ExploreScreen.styles';
import { MapLocationLink } from './MapLocationLink';
import { placeTypeLabel } from '../../../models/placeType';

type Props = {
  place: GooglePlace;
  saved: boolean;
  ready: boolean;
  onSave: () => void;
  onOpen: () => void;
};

function fallback(type: string) {
  if (type.includes('museum') || type.includes('gallery'))
    return require('../../../../assets/explore/gallery.jpg');
  if (type.includes('restaurant') || type.includes('cafe'))
    return require('../../../../assets/explore/restaurant.jpg');
  return require('../../../../assets/trips/coast.jpg');
}

export function GooglePlaceCard({ place, saved, ready, onSave, onOpen }: Props) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [summary, setSummary] = useState<PlaceSummary | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPhoto(null);
    setSummary(null);
    setImageFailed(false);
    placePhotoRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setPhoto(value);
      })
      .catch(() => {
        if (active) setPhoto(null);
      });
    placeSummaryRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setSummary(value);
      })
      .catch(() => {
        if (active) setSummary(null);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [place.title, place.countryCode]);
  const matched = !!photo && !imageFailed;
  const open = (url: string) => {
    if (/^https:\/\//.test(url)) void Linking.openURL(url);
  };
  return (
    <View className={styles.card}>
      <View className={styles.imageWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${place.title} ayrıntılarını aç`}
          onPress={onOpen}
          className="flex-1"
        >
          <Image
            source={matched ? { uri: photo.url } : fallback(place.type)}
            className={styles.cardImage}
            resizeMode="cover"
            accessibilityLabel={
              matched ? `${place.title} için eşleşen fotoğraf` : 'Temsili gezi görseli'
            }
            onError={() => setImageFailed(true)}
          />
        </Pressable>
        <View
          className={[styles.between, styles.imageTop].filter(Boolean).join(' ')}
          pointerEvents="box-none"
        >
          <View className={styles.badge}>
            <Text
              className={[styles.label, '!text-[7px] !text-[#49644F]'].filter(Boolean).join(' ')}
            >
              {matched ? 'EŞLEŞEN FOTOĞRAF' : 'TEMSİLİ GÖRSEL'}
            </Text>
          </View>
        </View>
      </View>
      <View className={styles.cardBody}>
        <View className={styles.between}>
          <Text
            className={[styles.muted, '!text-[8px] !flex-1'].filter(Boolean).join(' ')}
            numberOfLines={1}
          >
            {place.address}
          </Text>
          <MapLocationLink title={place.title} address={place.address} mapsUrl={place.mapsUrl} />
        </View>
        <Pressable accessibilityRole="button" onPress={onOpen}>
          <Text className={styles.cardTitle}>{place.title}</Text>
        </Pressable>
        {summary && (
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`${place.title} Vikipedi özetini aç`}
            onPress={() => open(summary.sourceUrl)}
            className="mb-4 mt-1 self-start flex-row items-center gap-1 py-2"
          >
            <Text className="font-manrope-semibold text-[10px] text-[#49644F] underline">
              Vikipedi özetini oku
            </Text>
            <Feather name="external-link" size={12} color="#49644F" />
          </Pressable>
        )}
        <View className={styles.between}>
          <View className={styles.tag}>
            <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
              {placeTypeLabel(place.type)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${place.title}: ${saved ? 'kaydı kaldır' : 'listeme kaydet'}`}
            disabled={!ready}
            onPress={onSave}
            className={styles.save}
          >
            <Feather name={saved ? 'check' : 'plus'} size={11} color="white" />
            <Text className={styles.saveText}>{saved ? 'Kaydedildi' : 'Kaydet'}</Text>
          </Pressable>
        </View>
        {matched && (
          <View className={[styles.row, '!flex-wrap !mt-[5px]'].filter(Boolean).join(' ')}>
            <Pressable accessibilityRole="link" onPress={() => open(photo.sourceUrl)}>
              <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
                Fotoğraf: {photo.author} ↗
              </Text>
            </Pressable>
          </View>
        )}
        {place.attributions.map((attribution, index) => (
          <Pressable
            key={`${attribution.provider}-${index}`}
            accessibilityRole="link"
            onPress={() => open(attribution.providerUri)}
            disabled={!attribution.providerUri}
          >
            <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
              {attribution.provider}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
