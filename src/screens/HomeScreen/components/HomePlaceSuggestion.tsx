import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { GooglePlace } from '../../../repositories/googlePlaces';
import { placePhotoRepository, type PlacePhoto } from '../../../repositories/placePhotos';
import { palette } from '../HomeScreen.styles';
import { placeTypeLabel } from '../../../models/placeType';

type Props = {
  place: GooglePlace;
  saved: boolean;
  ready: boolean;
  onSave: () => void;
  onOpen: () => void;
};

function fallback(type: string) {
  if (type.includes('restaurant') || type.includes('cafe'))
    return require('../../../../assets/explore/restaurant.jpg');
  if (type.includes('museum') || type.includes('gallery'))
    return require('../../../../assets/explore/gallery.jpg');
  return require('../../../../assets/trips/coast.jpg');
}

function open(url: string) {
  if (url.startsWith('https://')) void Linking.openURL(url);
}

export function HomePlaceSuggestion({ place, saved, ready, onSave, onOpen }: Props) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPhoto(null);
    setImageFailed(false);
    placePhotoRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setPhoto(value);
      })
      .catch(() => {
        if (active) setPhoto(null);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [place.title, place.countryCode]);

  const matched = !!photo && !imageFailed;
  return (
    <View className="mb-2 overflow-hidden rounded-xl border border-[#E7E8DF] bg-white">
      <View className="flex-row gap-3 p-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${place.title} ayrıntılarını aç`}
          onPress={onOpen}
        >
          <Image
            source={matched ? { uri: photo.url } : fallback(place.type)}
            onError={() => setImageFailed(true)}
            accessibilityLabel={matched ? `${place.title} fotoğrafı` : 'Temsili görsel'}
            className="h-[72px] w-[78px] rounded-lg"
          />
        </Pressable>
        <View className="min-w-0 flex-1 justify-center">
          <Pressable accessibilityRole="button" onPress={onOpen}>
            <Text
              numberOfLines={2}
              className="font-garamond text-[19px] leading-[20px] text-[#203E35]"
            >
              {place.title}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onOpen}>
            <Text
              numberOfLines={2}
              className="mt-1 font-manrope text-[9px] leading-[13px] text-[#778078]"
            >
              {place.address}
            </Text>
          </Pressable>
          <Text className="mt-1 font-manrope text-[8px] text-[#8B9389]">
            {placeTypeLabel(place.type)} · {matched ? 'Eşleşen fotoğraf' : 'Temsili görsel'}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${place.title}: ${saved ? 'kaydı kaldır' : 'kaydet'}`}
          accessibilityState={{ selected: saved, disabled: !ready }}
          disabled={!ready}
          onPress={onSave}
          className="h-10 w-8 items-center justify-center"
        >
          <Feather name={saved ? 'check' : 'bookmark'} size={16} color={palette.green} />
        </Pressable>
      </View>
      {matched && (
        <Pressable
          accessibilityRole="link"
          onPress={() => open(photo.sourceUrl)}
          className="px-2 pb-2"
        >
          <Text className="font-manrope text-[8px] text-[#778078]">Fotoğraf: {photo.author} ↗</Text>
        </Pressable>
      )}
      {place.attributions.map((attribution, index) => (
        <Pressable
          key={`${attribution.provider}-${index}`}
          accessibilityRole="link"
          onPress={() => open(attribution.providerUri)}
          className="px-2 pb-2"
        >
          <Text className="font-manrope text-[8px] text-[#778078]">{attribution.provider}</Text>
        </Pressable>
      ))}
    </View>
  );
}
