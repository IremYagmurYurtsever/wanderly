import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Feather from '@expo/vector-icons/Feather';
import { placePhotoRepository, type PlacePhoto } from '../../../repositories/placePhotos';
import { palette, styles } from '../HomeScreen.styles';

const featuredPlaces = [
  { title: 'Colosseum', countryCode: 'IT' },
  { title: 'Trevi Fountain', countryCode: 'IT' },
  { title: 'Pantheon Rome', countryCode: 'IT' },
];

const fallbackPhotos = [
  require('../../../../assets/trips/rome.jpg'),
  require('../../../../assets/trips/kyoto.jpg'),
  require('../../../../assets/trips/alps.jpg'),
];

type SearchBarProps = {
  name: string;
  query: string;
  searchReady: boolean;
  searching: boolean;
  searchOpen: boolean;
  onChangeQuery: (query: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onSubmitSearch: () => void;
  onProfile: () => void;
  placeholder?: string;
};

type Props = {
  overlap: number;
};

export function HomeSearchBar({
  name,
  query,
  searchReady,
  searching,
  searchOpen,
  onChangeQuery,
  onOpenSearch,
  onCloseSearch,
  onSubmitSearch,
  onProfile,
  placeholder = 'Mekân, restoran veya otel ara',
}: SearchBarProps) {
  const initial = name.trim().charAt(0).toLocaleUpperCase('tr-TR') || 'Y';
  return (
    <View
      className={`flex-row items-center border py-2 pl-4 pr-1 ${searchOpen ? 'rounded-t-[24px] border-b-0 border-[#E7E8DF] bg-[#FFFEFA]' : 'rounded-[30px] border-[#FFFFFF75] bg-[#F8F9F1E8]'}`}
    >
      {searchOpen ? (
        <TextInput
          autoFocus
          accessibilityLabel={placeholder}
          value={query}
          onChangeText={onChangeQuery}
          onSubmitEditing={onSubmitSearch}
          editable={searchReady}
          returnKeyType="search"
          maxLength={80}
          placeholder={placeholder}
          placeholderTextColor={palette.muted}
          className="min-h-10 min-w-0 flex-1 font-manrope text-[12px] text-[#203E35]"
        />
      ) : (
        <Text className="flex-1 font-garamond text-[27px] text-[#203E35]">Wanderly</Text>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={searchOpen ? 'Mekânları ara' : 'Aramayı aç'}
        disabled={searchOpen && (!searchReady || searching)}
        onPress={searchOpen ? onSubmitSearch : onOpenSearch}
        className="h-10 w-10 items-center justify-center"
      >
        {searching ? (
          <ActivityIndicator size="small" color={palette.green} />
        ) : (
          <Feather name="search" size={16} color={palette.muted} />
        )}
      </Pressable>
      {searchOpen ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Aramayı kapat"
          onPress={onCloseSearch}
          className="h-10 w-9 items-center justify-center"
        >
          <Feather name="x" size={18} color={palette.muted} />
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profilim"
          onPress={onProfile}
          className="h-10 w-9 items-center justify-center"
        >
          <View className="h-[29px] w-[29px] items-center justify-center rounded-[15px] bg-[#DDE1CE]">
            <Text className="font-manrope text-[10px] text-[#203E35]">{initial}</Text>
          </View>
        </Pressable>
      )}
    </View>
  );
}

export function HomeHeader({ overlap }: Props) {
  const [photos, setPhotos] = useState<PlacePhoto[]>([]);
  const [photoIndex, setPhotoIndex] = useState(0);
  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    void Promise.all(
      featuredPlaces.map(({ title, countryCode }) =>
        placePhotoRepository.load(title, countryCode, controller.signal).catch(() => null),
      ),
    ).then((results) => {
      if (active)
        setPhotos(
          results.filter(
            (photo): photo is PlacePhoto =>
              photo !== null && /^(CC0|Public domain)/i.test(photo.license),
          ),
        );
    });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);
  useEffect(() => {
    const count = photos.length || fallbackPhotos.length;
    const timer = setInterval(() => setPhotoIndex((index) => (index + 1) % count), 15000);
    return () => clearInterval(timer);
  }, [photos.length]);
  const featuredPhoto = photos.length ? photos[photoIndex % photos.length] : null;
  const hour = new Date().getHours();
  const greeting =
    hour >= 5 && hour < 12 ? 'GÜNAYDIN' : hour >= 12 && hour < 18 ? 'TÜNAYDIN' : 'İYİ AKŞAMLAR';
  return (
    <View className="px-[22px] pb-[20px]" style={{ marginTop: -overlap, paddingTop: overlap + 12 }}>
      <View pointerEvents="none" className="absolute left-0 right-0 top-0 h-[350px]">
        <Image
          source={
            featuredPhoto
              ? { uri: featuredPhoto.url }
              : fallbackPhotos[photoIndex % fallbackPhotos.length]
          }
          resizeMode="cover"
          onError={() => {
            if (featuredPhoto) {
              setPhotos((current) => current.filter((photo) => photo.url !== featuredPhoto.url));
              setPhotoIndex(0);
            }
          }}
          accessibilityLabel="Roma seyahat fotoğrafı"
          className="absolute h-full w-full"
        />
        <BlurView intensity={18} tint="light" className="absolute inset-0" />
        <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 440 380">
          <Defs>
            <LinearGradient id="home-hero" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#F8F7F2" stopOpacity={0.18} />
              <Stop offset="0.3" stopColor="#F8F7F2" stopOpacity={0.2} />
              <Stop offset="0.68" stopColor="#F8F7F2" stopOpacity={0.42} />
              <Stop offset="1" stopColor="#F8F7F2" />
            </LinearGradient>
          </Defs>
          <Rect width="440" height="380" fill="url(#home-hero)" />
        </Svg>
      </View>
      <View className="mt-[112px] items-start">
        <View
          className={[
            styles.row,
            '!self-start !bg-[#F8F9F1D9] !rounded-[20px] !gap-[4px] !px-[8px] !py-[6px]',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <Feather name="sun" size={10} color={palette.green} />
          <Text className={[styles.label, '!text-[8px] !tracking-[1px]'].filter(Boolean).join(' ')}>
            {greeting}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          className="mt-[10px] font-garamond text-[38px] leading-[38px] text-[#203E35]"
        >
          Sıradaki durak{'\n'}
          <Text className="italic">neresi olsun?</Text>
        </Text>
      </View>
    </View>
  );
}
