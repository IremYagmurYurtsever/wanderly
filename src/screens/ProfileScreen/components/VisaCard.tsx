import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View, type ImageSourcePropType } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { tripCoverSearch } from '../../../models/tripCover';
import { visaExpiry, type Visa } from '../../../models/visa';
import { placePhotoRepository, type PlacePhoto } from '../../../repositories/placePhotos';

type Props = { visa: Visa; countryName: string; onOpen: () => void };

function fallback(code: string): ImageSourcePropType | null {
  if (code === 'IT') return require('../../../../assets/trips/rome.jpg');
  if (code === 'CH') return require('../../../../assets/trips/alps.jpg');
  if (code === 'JP') return require('../../../../assets/trips/kyoto.jpg');
  return null;
}

export function VisaCard({ visa, countryName, onOpen }: Props) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [failed, setFailed] = useState(false);
  const search = tripCoverSearch({
    countryCode: visa.countryCode,
    destination: countryName,
    stops: [],
  });
  const status = visaExpiry(visa);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    setPhoto(null);
    setFailed(false);
    if (search)
      void placePhotoRepository
        .load(search.title, search.countryCode, controller.signal)
        .then((result) =>
          result && /^(CC0|Public domain)/i.test(result.license)
            ? result
            : placePhotoRepository.load(countryName, search.countryCode, controller.signal),
        )
        .then((result) => {
          if (active && result && /^(CC0|Public domain)/i.test(result.license)) setPhoto(result);
        })
        .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [search?.title, search?.countryCode, countryName]);
  const image = photo && !failed ? { uri: photo.url } : fallback(visa.countryCode);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${countryName} vizesini düzenle`}
      onPress={onOpen}
      className="overflow-hidden rounded-2xl border border-[#ECEDE4] bg-[#FFFEFA]"
    >
      <View className="h-[132px] bg-[#DCE6D9]">
        {image ? (
          <Image
            source={image}
            onError={() => setFailed(true)}
            resizeMode="cover"
            className="absolute h-full w-full"
            accessibilityLabel={`${countryName} seyahat görseli`}
          />
        ) : (
          <View className="absolute h-full w-full items-center justify-center bg-[#DCE6D9]">
            <Feather name="globe" size={44} color="#617F6D" />
          </View>
        )}
        <View className="flex-1 justify-end bg-[#142E2755] p-4">
          <Text className="font-garamond text-[26px] text-white">{countryName}</Text>
        </View>
      </View>
      <View className="flex-row items-center gap-3 p-4">
        <View className="flex-1">
          <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
            {visa.durationDays} günlük vize
          </Text>
          <Text className="mt-1 font-manrope text-[9px] text-[#8B9389]">
            {visa.validFrom} · Bitiş {status.expiresOn}
          </Text>
        </View>
        <View className="items-end">
          <Text className="font-manrope-semibold text-[12px] text-[#203E35]">
            {status.expired ? 'Süresi doldu' : `${status.daysLeft} gün kaldı`}
          </Text>
          <Feather name="chevron-right" size={15} color="#8B9389" />
        </View>
      </View>
    </Pressable>
  );
}
