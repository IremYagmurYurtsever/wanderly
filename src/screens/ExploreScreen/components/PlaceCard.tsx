import { Image, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { Place } from '../ExploreScreen.data';
import { palette, styles } from '../ExploreScreen.styles';
import { MapLocationLink } from './MapLocationLink';

type PlaceCardProps = {
  place: Place;
  saved: boolean;
  ready: boolean;
  onSave: () => void;
  onOpen: () => void;
};

export function PlaceCard({ place, saved, ready, onSave, onOpen }: PlaceCardProps) {
  return (
    <View className={[styles.card, place.compact && styles.compact].filter(Boolean).join(' ')}>
      <View
        className={[styles.imageWrap, place.compact && styles.compactImage]
          .filter(Boolean)
          .join(' ')}
      >
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${place.title} ayrıntıları`}
          className="flex-1"
        >
          <Image
            source={place.image}
            className={styles.cardImage}
            resizeMode="cover"
            accessibilityLabel={place.title}
          />
        </Pressable>
        <View
          className={[styles.between, styles.imageTop].filter(Boolean).join(' ')}
          pointerEvents="box-none"
        >
          {!place.compact ? (
            <View className={styles.badge}>
              <Text
                className={[styles.label, '!text-[7px] !text-[#49644F]'].filter(Boolean).join(' ')}
              >
                {place.quiet ? 'SAKLI BİR HAZİNE' : 'YEREL FAVORİ'}
              </Text>
            </View>
          ) : (
            <View />
          )}
        </View>
      </View>
      <View className={`${styles.cardBody} ${place.compact ? '!flex-1 !p-[10px]' : ''}`}>
        {place.compact ? (
          <View className={styles.between}>
            <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
              {place.tag}
            </Text>
            <View className={[styles.row, '!gap-[3px]'].filter(Boolean).join(' ')}>
              {place.mappable !== false && (
                <MapLocationLink title={place.title} address={place.location} />
              )}
              <Feather name="star" size={10} color="#BB8659" />
              <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
                {place.rating} · örnek
              </Text>
            </View>
          </View>
        ) : (
          <View className={styles.between}>
            <Text
              className={[styles.muted, '!text-[8px] !flex-1'].filter(Boolean).join(' ')}
              numberOfLines={1}
            >
              {place.location}
            </Text>
            <View className={[styles.row, '!gap-[3px]'].filter(Boolean).join(' ')}>
              <MapLocationLink title={place.title} address={place.location} />
              <Feather name="star" size={10} color="#BB8659" />
              <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
                {place.rating} · örnek
              </Text>
            </View>
          </View>
        )}
        <Pressable accessibilityRole="button" onPress={onOpen}>
          <Text
            className={`${styles.cardTitle} ${place.compact ? '!text-[21px] !leading-[23px]' : ''}`}
          >
            {place.title}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          className={place.compact ? 'grow' : ''}
        >
          <Text className={`${styles.muted} mb-[14px]`}>{place.description}</Text>
        </Pressable>
        <View className={`${styles.between} ${place.compact ? '!mt-auto' : ''}`}>
          {!place.compact && (
            <View className={styles.tag}>
              <Text className={[styles.muted, '!text-[8px]'].filter(Boolean).join(' ')}>
                {place.tag}
              </Text>
            </View>
          )}
          <Pressable
            disabled={!ready}
            accessibilityRole="button"
            accessibilityLabel={`${place.title}: ${saved ? 'kaydı kaldır' : 'listeme kaydet'}`}
            accessibilityState={{ selected: saved, disabled: !ready }}
            onPress={onSave}
            className={`${styles.save} ${place.compact ? '!flex-1 !bg-[#EFF0E7]' : ''}`}
          >
            <Feather
              name={saved ? 'check' : 'plus'}
              size={11}
              color={place.compact ? palette.green : 'white'}
            />
            <Text className={`${styles.saveText} ${place.compact ? '!text-[#49644F]' : ''}`}>
              {saved ? 'Kaydedildi' : 'Kaydet'}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
