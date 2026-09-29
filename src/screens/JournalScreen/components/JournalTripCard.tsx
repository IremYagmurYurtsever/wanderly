import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTripCoverPhoto } from '../../../hooks/useTripCoverPhoto';
import type { SavedTrip } from '../../../models/trip';
import { tripTiming } from '../../../models/tripDates';

type Props = {
  trip: SavedTrip;
  memoryCount: number;
  photoCount: number;
  onOpen: () => void;
};

export function JournalTripCard({ trip, memoryCount, photoCount, onOpen }: Props) {
  const cover = useTripCoverPhoto(trip);
  const ongoing = tripTiming(trip).status === 'ongoing';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${trip.destination} tatili günlüğünü aç`}
      onPress={onOpen}
      className="mb-4 overflow-hidden rounded-[22px] border border-[#E2E8DF] bg-[#FFFEFA]"
    >
      <View className="h-[174px] bg-[#617963]">
        <Image
          source={cover.source}
          onError={cover.onError}
          resizeMode="cover"
          className="absolute h-full w-full"
        />
        <View className="flex-1 justify-between bg-[#17372B55] p-4">
          <View className="flex-row items-center justify-between">
            <Text className="rounded-full bg-[#FFFEF0EB] px-3 py-1 font-manrope-semibold text-[8px] tracking-[1px] text-[#203E35]">
              SEYAHAT DEFTERİ
            </Text>
            {ongoing && (
              <Text className="rounded-full bg-[#DCE9D4] px-3 py-1 font-manrope-semibold text-[9px] text-[#49644F]">
                Devam ediyor
              </Text>
            )}
          </View>
          <View>
            <Text className="font-garamond text-[31px] leading-[34px] text-white">
              {trip.destination} tatili
            </Text>
            <Text className="mt-1 font-manrope text-[10px] text-[#F1F4EA]">{trip.dates}</Text>
          </View>
        </View>
      </View>
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="font-manrope text-[10px] text-[#49644F]">
          {memoryCount} anı · {photoCount} fotoğraf
        </Text>
        <View className="flex-row items-center gap-1">
          <Text className="font-manrope-semibold text-[10px] text-[#203E35]">Defteri aç</Text>
          <Feather name="arrow-right" size={14} color="#203E35" />
        </View>
      </View>
    </Pressable>
  );
}
