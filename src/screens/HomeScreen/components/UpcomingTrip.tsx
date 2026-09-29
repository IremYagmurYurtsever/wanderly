import { useEffect, useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { palette, styles } from '../HomeScreen.styles';
import type { Trip } from '../HomeScreen.types';
import { tripTiming } from '../../../models/tripDates';
import { tripCoverSearch } from '../../../models/tripCover';
import { placePhotoRepository, type PlacePhoto } from '../../../repositories/placePhotos';

function fallbackImage(countryCode?: string) {
  if (countryCode === 'IT') return require('../../../../assets/trips/rome.jpg');
  if (countryCode === 'CH') return require('../../../../assets/trips/alps.jpg');
  if (countryCode === 'JP') return require('../../../../assets/trips/kyoto.jpg');
  return require('../../../../assets/trips/coast.jpg');
}

export function UpcomingTrip({
  trip,
  count,
  onDetails,
  onAll,
}: {
  trip: Trip;
  count?: number;
  onDetails: () => void;
  onAll: () => void;
}) {
  const [photo, setPhoto] = useState<PlacePhoto | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const search = tripCoverSearch(trip);
  useEffect(() => {
    setPhoto(null);
    setImageFailed(false);
    if (!search) return;
    let active = true;
    const controller = new AbortController();
    void placePhotoRepository
      .load(search.title, search.countryCode, controller.signal)
      .then((result) =>
        result || search.title === search.fallbackTitle || !active
          ? result
          : placePhotoRepository.load(search.fallbackTitle, search.countryCode, controller.signal),
      )
      .then((result) => {
        if (active) setPhoto(result);
      })
      .catch(() => {});
    return () => {
      active = false;
      controller.abort();
    };
  }, [search?.countryCode, search?.title, search?.fallbackTitle]);
  const showPhoto = !!photo && !imageFailed;
  const timing = tripTiming(trip);
  const status =
    timing.status === 'upcoming' && timing.days !== null
      ? `${timing.days} gün kaldı`
      : timing.status === 'ongoing'
        ? timing.days === 0
          ? 'Bugün dönüş günü'
          : `Dönüşe ${timing.days} gün`
        : timing.status === 'past'
          ? 'Tamamlandı'
          : 'Tarih ekle';
  return (
    <View className={styles.section}>
      {count !== undefined && (
        <View className={[styles.between, '!mb-[12px]'].filter(Boolean).join(' ')}>
          <View className={[styles.row, '!gap-[8px]'].filter(Boolean).join(' ')}>
            <Text className={[styles.title, '!text-[23px]'].filter(Boolean).join(' ')}>
              Gezi planların
            </Text>
            <View className="bg-[#E8EDDF] w-[21px] h-[21px] rounded-[11px] items-center justify-center">
              <Text className={[styles.small, '!text-[#203E35]'].filter(Boolean).join(' ')}>
                {count}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={onAll}
            className={[styles.row, '!gap-[4px] !py-[8px]'].filter(Boolean).join(' ')}
          >
            <Text className={[styles.small, '!text-[#49644F]'].filter(Boolean).join(' ')}>
              Tümünü gör
            </Text>
            <Feather name="chevron-right" size={12} color={palette.green} />
          </Pressable>
        </View>
      )}
      <View className="rounded-[20px] overflow-hidden border-[1px] border-[#E7E8DF] bg-[#FEFDFA]">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${trip.destination} gezi detayları`}
          onPress={onDetails}
          className="h-[190px] bg-[#9EAC98]"
        >
          <View pointerEvents="none" className="absolute inset-0">
            <Image
              source={showPhoto ? { uri: photo.url } : fallbackImage(search?.countryCode)}
              resizeMode="cover"
              onError={() => setImageFailed(true)}
              accessibilityLabel={
                showPhoto ? `${trip.destination} gezi fotoğrafı` : 'Temsili seyahat görseli'
              }
              className="h-full w-full"
            />
            <View className="absolute inset-0 bg-[#203E3566]" />
          </View>
          <View className={[styles.between, '!p-[14px]'].filter(Boolean).join(' ')}>
            <View className="rounded-[15px] px-[9px] py-[5px] bg-[#FAFCF3E8]">
              <Text
                className={[styles.label, '!text-[7px] !tracking-[0.7px]']
                  .filter(Boolean)
                  .join(' ')}
              >
                KAYITLI PLAN
              </Text>
            </View>
          </View>
          <View className="mt-auto p-[16px]">
            <Text
              className={[styles.label, '!text-[#D5DEC9] !text-[8px]'].filter(Boolean).join(' ')}
            >
              SENİN ROTAN
            </Text>
            <Text className="font-garamond text-[#FFFDF2] text-[30px] mt-[3px]">
              {trip.destination}
            </Text>
          </View>
        </Pressable>
        <View className="p-[15px]">
          <View className={[styles.row, '!gap-[12px]'].filter(Boolean).join(' ')}>
            <View className={styles.iconCircle}>
              <Feather name="calendar" size={15} color={palette.green} />
            </View>
            <View className="flex-1">
              <Text
                className={[styles.label, '!text-[7px] !tracking-[0.8px]']
                  .filter(Boolean)
                  .join(' ')}
              >
                TARİHLER
              </Text>
              <Text className={[styles.body, '!text-[11px] !mt-[4px]'].filter(Boolean).join(' ')}>
                {trip.dates}
              </Text>
            </View>
            <View>
              <Text
                className={[styles.label, '!text-[7px] !tracking-[0.8px]']
                  .filter(Boolean)
                  .join(' ')}
              >
                DURUM
              </Text>
              <Text
                className={[styles.body, '!text-[10px] !mt-[4px] !text-[#BD7C61]']
                  .filter(Boolean)
                  .join(' ')}
              >
                {status}
              </Text>
            </View>
          </View>
          {showPhoto && (
            <Text
              numberOfLines={2}
              className={[styles.small, '!text-[8px] !mt-[10px]'].filter(Boolean).join(' ')}
            >
              Fotoğraf: {photo.author}
            </Text>
          )}
          {!showPhoto && (
            <Text className={[styles.small, '!text-[8px] !mt-[10px]'].filter(Boolean).join(' ')}>
              Temsili seyahat görseli
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            onPress={onDetails}
            className={[styles.between, '!p-[11px] !bg-[#F4F3ED] !rounded-[11px] !mt-[13px]']
              .filter(Boolean)
              .join(' ')}
          >
            <View className={[styles.row, '!gap-[7px]'].filter(Boolean).join(' ')}>
              <Feather name="edit-3" size={12} color={palette.green} />
              <Text className={[styles.small, '!text-[#203E35]'].filter(Boolean).join(' ')}>
                Planı düzenle veya sil
              </Text>
            </View>
            <Feather name="arrow-up-right" size={13} color={palette.green} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
