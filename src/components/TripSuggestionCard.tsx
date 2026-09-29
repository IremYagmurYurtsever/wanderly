import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { GooglePlace } from '../repositories/googlePlaces';
import { placePhotoRepository, type PlacePhoto } from '../repositories/placePhotos';

type Props = {
  place: GooglePlace;
  selected: boolean;
  onOpen: () => void;
  onAdd: () => void;
};

function fallback(type: string) {
  if (type.includes('museum') || type.includes('gallery'))
    return require('../../assets/explore/gallery.jpg');
  if (type.includes('restaurant') || type.includes('cafe'))
    return require('../../assets/explore/restaurant.jpg');
  return require('../../assets/trips/coast.jpg');
}

export function TripSuggestionCard({ place, selected, onOpen, onAdd }: Props) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPhoto(null);
    setImageFailed(false);
    void placePhotoRepository
      .load(place.title, place.countryCode, controller.signal)
      .then((value) => {
        if (active) setPhoto(value && /^(CC0|Public domain)/i.test(value.license) ? value : null);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [place.title, place.countryCode]);
  const matched = !!photo && !imageFailed;
  return (
    <View className="mr-3 w-[158px] overflow-hidden rounded-[16px] border border-[#E7E8DF] bg-white">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${place.title} ayrıntılarını aç`}
        onPress={onOpen}
      >
        <Image
          source={matched ? { uri: photo.url } : fallback(place.type)}
          onError={() => setImageFailed(true)}
          resizeMode="cover"
          accessibilityLabel={matched ? `${place.title} fotoğrafı` : 'Temsili gezi görseli'}
          className="h-[98px] w-full"
        />
        <View className="px-3 pt-3">
          <Text
            numberOfLines={2}
            className="min-h-[34px] font-garamond text-[17px] leading-[17px] text-[#203E35]"
          >
            {place.title}
          </Text>
          <Text numberOfLines={1} className="mt-1 font-manrope text-[8px] text-[#778078]">
            {place.address}
          </Text>
        </View>
      </Pressable>
      <View className="mt-auto px-3 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${place.title} ${selected ? 'eklendi' : 'rotaya ekle'}`}
          accessibilityState={{ disabled: selected }}
          disabled={selected}
          onPress={onAdd}
          className={`min-h-9 flex-row items-center justify-center gap-1 rounded-[9px] ${selected ? 'bg-[#E9EEE4]' : 'bg-[#203E35]'}`}
        >
          <Feather
            name={selected ? 'check' : 'plus'}
            size={12}
            color={selected ? '#203E35' : '#FFFFFF'}
          />
          <Text
            className={`font-manrope-semibold text-[9px] ${selected ? 'text-[#203E35]' : 'text-white'}`}
          >
            {selected ? 'Eklendi' : 'Ekle'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
