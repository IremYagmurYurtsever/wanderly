import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useTripCoverPhoto } from '../../../hooks/useTripCoverPhoto';
import type { Journey } from '../TripsScreen.types';
import { ink, muted, styles } from '../TripsScreen.styles';

type CardProps = { journey: Journey; onOpen: () => void };

export function ActiveJourneyCard({ journey, onOpen }: CardProps) {
  const image = useTripCoverPhoto(journey.trip);
  return (
    <View className={`${styles.card} mb-3`}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${journey.title} gezi planını aç`}
        onPress={onOpen}
        className="h-[210px] bg-[#617963]"
      >
        <Image
          source={image.source}
          onError={image.onError}
          resizeMode="cover"
          className="absolute h-full w-full"
        />
        <View className="flex-1 bg-[#17372B55] p-[15px]">
          <View className={styles.between}>
            <View className="flex-row items-center gap-1 rounded-[16px] bg-[#FFFDF3E8] px-[9px] py-[5px]">
              <Feather name="map-pin" size={10} color={ink} />
              <Text className={`${styles.small} text-[#203E35]`}>{journey.location}</Text>
            </View>
            <Text className="rounded-[14px] bg-[#FFFDF3E8] px-[9px] py-[6px] font-manrope-semibold text-[8px] text-[#203E35]">
              {journey.duration}
            </Text>
          </View>
          <View className="mt-auto">
            <Text className="font-manrope-semibold text-[8px] tracking-[1px] text-[#ECE9D9]">
              YOLCULUĞUN SÜRÜYOR
            </Text>
            <Text className="mt-1 font-garamond text-[33px] leading-[34px] text-white">
              {journey.title}
            </Text>
          </View>
        </View>
      </Pressable>
      <View className="p-[14px]">
        <View className={styles.between}>
          <View className="flex-row items-center gap-[5px]">
            <Feather name="calendar" size={12} color={muted} />
            <Text className={`${styles.small} text-[#203E35]`}>{journey.dates}</Text>
          </View>
          <Text className={styles.small}>{journey.trip.stops?.length ?? 0} durak</Text>
        </View>
        {!!journey.trip.budget && (
          <Text className={`${styles.small} mt-2`}>
            Bütçe: {journey.trip.budget} {journey.trip.currency ?? ''}
          </Text>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className={`${styles.button} mt-[14px]`}
        >
          <Text className={styles.buttonText}>Yolculuk panelini aç</Text>
          <Feather name="arrow-right" size={16} color="white" />
        </Pressable>
      </View>
    </View>
  );
}

export function UpcomingJourneyCard({ journey, onOpen }: CardProps) {
  const image = useTripCoverPhoto(journey.trip);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${journey.title} rotasını aç`}
      onPress={onOpen}
      className={[styles.card, '!mb-[10px] !flex-row !gap-[12px] !p-[10px]']
        .filter(Boolean)
        .join(' ')}
    >
      <View className="min-h-[102px] w-[88px] overflow-hidden rounded-[12px] bg-[#DDE6D6]">
        <Image
          source={image.source}
          onError={image.onError}
          resizeMode="cover"
          className="absolute h-full w-full"
        />
        <View className="absolute bottom-[6px] left-[6px] rounded-[4px] bg-[#243E31D9] p-[4px]">
          <Text className={`${styles.small} text-[7px] text-white`}>Kaydedildi</Text>
        </View>
      </View>
      <View className="flex-1 py-[3px]">
        <View className={styles.between}>
          <Text className={styles.label}>KAYITLI PLAN</Text>
          <Text className={`${styles.small} text-[8px]`}>{journey.duration}</Text>
        </View>
        <Text className={`${styles.title} mt-[5px] text-[22px]`}>{journey.title}</Text>
        <Text className={`${styles.small} mt-[3px] text-[8px]`}>{journey.dates}</Text>
        <View className="mt-auto flex-row items-center justify-end pt-[10px]">
          <View className="flex-row items-center gap-[3px]">
            <Text className={`${styles.small} text-[8px] text-[#203E35]`}>Rotayı gör</Text>
            <Feather name="chevron-right" size={11} color={ink} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export function PastJourneyCard({ journey, onOpen }: CardProps) {
  const image = useTripCoverPhoto(journey.trip);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${journey.title} gezi planını aç`}
      onPress={onOpen}
      className="mb-[9px] flex-row gap-[11px] rounded-[13px] bg-[#F3F2ED] p-[10px]"
    >
      <Image
        source={image.source}
        onError={image.onError}
        resizeMode="cover"
        className="h-[72px] w-[72px] rounded-[9px]"
      />
      <View className="flex-1">
        <View className={styles.between}>
          <Text className={`${styles.title} flex-1 text-[19px]`}>{journey.title}</Text>
          <Feather name="chevron-right" size={14} color={muted} />
        </View>
        <Text className={`${styles.small} mt-[2px] text-[8px]`}>{journey.dates}</Text>
        <Text className={`${styles.small} mt-[6px] text-[8px]`}>
          {journey.trip.stops?.length ?? 0} durak{journey.trip.notes ? ' · Not eklendi' : ''}
        </Text>
      </View>
    </Pressable>
  );
}
