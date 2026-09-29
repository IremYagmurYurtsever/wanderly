import { savedCount, matchesCollection } from './exploreSelectors';
import { ScreenHeader } from '../../components/ScreenHeader';
import { createTabHandler } from '../../navigation/routes';
import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { HomeBottomBar } from '../../components/HomeBottomBar';
import type { Notice, Screen } from '../../types';
import { categories, places, type Category, type Place } from './ExploreScreen.data';
import { palette, styles } from './ExploreScreen.styles';
import { PlaceCard } from './components/PlaceCard';
import { useSavedPlaces } from './useSavedPlaces';
import { googlePlacesRepository, type Country } from '../../repositories/googlePlaces';
import { countriesQuery } from '../../query/places';
import { ApiError } from '../../services/api/client';
import { GooglePlaceCard } from './components/GooglePlaceCard';
import type { DetailPlace } from '../PlaceDetailScreen/PlaceDetailScreen';

type ExploreScreenProps = {
  name: string;
  go: (screen: Screen) => void;
  setNotice: (notice: Notice) => void;
  onOpenPlace: (place: DetailPlace) => void;
};

const fallbackCountries: Country[] = [{ code: 'IT', label: 'İtalya' }];

export function ExploreScreen({ name, go, onOpenPlace }: ExploreScreenProps) {
  const [category, setCategory] = useState<Category>('Tümü');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [countryCode, setCountryCode] = useState('IT');
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const { saved, ready, error, toggle } = useSavedPlaces();
  const countryList = useQuery(countriesQuery);
  const countries = countryList.data?.length ? countryList.data : fallbackCountries;
  const countryLabel = countries.find((item) => item.code === countryCode)?.label ?? 'İtalya';
  const savedKey = saved.join('|');
  const placesQuery = useQuery({
    queryKey: ['places', 'explore', countryCode, category, submittedQuery, savedKey],
    enabled: category !== 'Kaydedilenler' || ready,
    queryFn: () =>
      category === 'Kaydedilenler'
        ? googlePlacesRepository.saved(countryCode)
        : googlePlacesRepository.search(
            countryCode,
            category === 'Müzeler'
              ? 'museums'
              : category === 'Gastronomi'
                ? 'food'
                : category === 'Konaklama'
                  ? 'hotels'
                  : category === 'Sakin köşeler'
                    ? 'parks'
                    : 'all',
            submittedQuery,
          ),
  });
  const googlePlaces = placesQuery.data ?? [];
  const googleLoading = placesQuery.isPending && (category !== 'Kaydedilenler' || ready);
  const googleMessage = placesQuery.isError
    ? placesQuery.error instanceof ApiError && placesQuery.error.code === 'GOOGLE_KEY_MISSING'
      ? 'Google mekân anahtarı henüz eklenmedi.'
      : placesQuery.error instanceof ApiError && placesQuery.error.code === 'GOOGLE_KEY_INVALID'
        ? 'Google mekân anahtarı geçersiz. Backend ayarlarını kontrol et.'
        : `Google’dan ${category === 'Konaklama' ? 'oteller' : 'mekânlar'} yüklenemedi. Bağlantıyı ve API ayarlarını kontrol et.`
    : '';
  const scroll = useRef<ScrollView>(null);
  const sectionOffset = useRef(0);
  const visible =
    countryCode !== 'IT'
      ? []
      : places.filter((place) => {
          const matchesCategory =
            category === 'Tümü' ||
            (category === 'Kaydedilenler'
              ? saved.includes(place.id)
              : category === 'Sakin köşeler'
                ? place.quiet
                : place.category === category);
          return (
            matchesCategory &&
            `${place.title} ${place.location} ${place.tag}`
              .toLocaleLowerCase('tr-TR')
              .includes(query.trim().toLocaleLowerCase('tr-TR'))
          );
        });

  const select = createTabHandler('Keşfet', go, () =>
    scroll.current?.scrollTo({ y: 0, animated: true }),
  );

  function collection(next: Category) {
    setCategory(next);
    setQuery('');
    setSubmittedQuery('');
    scroll.current?.scrollTo({
      y: countryCode === 'IT' ? sectionOffset.current : 0,
      animated: true,
    });
  }

  function details(place: Place) {
    onOpenPlace(place);
  }

  function card(place: Place) {
    return (
      <PlaceCard
        key={place.id}
        place={place}
        saved={saved.includes(place.id)}
        ready={ready}
        onSave={() => toggle(place.id)}
        onOpen={() => details(place)}
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} className={styles.page}>
      <ScrollView
        ref={scroll}
        className="flex-1"
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className={styles.content}>
          <ScreenHeader
            name={name}
            searchOpen={searchOpen}
            onSearch={() => {
              setSearchOpen(!searchOpen);
              setQuery('');
              setSubmittedQuery('');
            }}
            onProfile={() => select('Profil')}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Ülke seç: ${countryLabel}`}
            onPress={() => setCountryOpen(!countryOpen)}
            className={[styles.between, styles.countrySelector].filter(Boolean).join(' ')}
          >
            <View className={styles.row}>
              <Feather name="globe" size={18} color={palette.green} />
              <View>
                <Text className={styles.label}>KEŞİF ÜLKESİ</Text>
                <Text className={[styles.text, '!text-[15px]'].filter(Boolean).join(' ')}>
                  {countryLabel}
                </Text>
              </View>
            </View>
            <Feather
              name={countryOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={palette.green}
            />
          </Pressable>
          {countryOpen && (
            <View className={styles.countryList}>
              <TextInput
                accessibilityLabel="Ülke ara"
                placeholder="Ülke ara…"
                placeholderTextColor={palette.muted}
                value={countryQuery}
                onChangeText={setCountryQuery}
                className={styles.search}
              />
              <ScrollView
                nestedScrollEnabled
                className="max-h-[225px]"
                keyboardShouldPersistTaps="handled"
              >
                {countries
                  .filter((item) =>
                    item.label
                      .toLocaleLowerCase('tr-TR')
                      .includes(countryQuery.toLocaleLowerCase('tr-TR')),
                  )
                  .map((item) => (
                    <Pressable
                      key={item.code}
                      accessibilityRole="button"
                      accessibilityState={{ selected: item.code === countryCode }}
                      onPress={() => {
                        setCountryCode(item.code);
                        setCountryOpen(false);
                        setCountryQuery('');
                        setQuery('');
                        setSubmittedQuery('');
                      }}
                      className={styles.countryOption}
                    >
                      <Text className={styles.text}>{item.label}</Text>
                      {item.code === countryCode && (
                        <Feather name="check" size={15} color={palette.green} />
                      )}
                    </Pressable>
                  ))}
              </ScrollView>
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="py-4"
          >
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => collection(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: category === item }}
                className={`${styles.chip} ${category === item ? '!bg-[#203E35]' : ''}`}
              >
                <Text className={`${styles.chipText} ${category === item ? '!text-white' : ''}`}>
                  {item}
                  {item === 'Kaydedilenler' && countryCode === 'IT'
                    ? ` (${savedCount(
                        saved,
                        places.map((place) => place.id),
                      )})`
                    : ''}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          {searchOpen && (
            <TextInput
              autoFocus
              accessibilityLabel={category === 'Konaklama' ? 'Otel araması' : 'Mekân araması'}
              placeholder={
                category === 'Konaklama'
                  ? 'Bir otel veya bölge ara…'
                  : 'Bir mekân, semt veya lezzet ara…'
              }
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => setSubmittedQuery(query.trim())}
              returnKeyType="search"
              className={styles.search}
              placeholderTextColor={palette.muted}
            />
          )}
          {countryCode === 'IT' && category !== 'Konaklama' && (
            <>
              <View className={styles.hero}>
                <Image
                  source={require('../../../assets/trips/rome.jpg')}
                  className={styles.heroImage}
                  resizeMode="cover"
                  accessibilityLabel="Roma manzarası"
                />
                <View className={styles.heroShade} />
                <View className={[styles.between, styles.heroTop].filter(Boolean).join(' ')}>
                  <View className={styles.badge}>
                    <Text
                      className={[styles.label, '!text-[7px] !text-[#9C724D]']
                        .filter(Boolean)
                        .join(' ')}
                    >
                      ÖZEL KOLEKSİYON · ROMA
                    </Text>
                  </View>
                </View>
                <View className={styles.heroBody}>
                  <Text
                    className={[styles.label, '!text-[#D9C898] !text-[7px] !mb-[7px]']
                      .filter(Boolean)
                      .join(' ')}
                  >
                    YAVAŞLA, ŞEHRİ HİSSET
                  </Text>
                  <Text className={styles.heroTitle}>Roma: Ebedî Şehirde{'\n'}altın saatler</Text>
                  <Text className={styles.heroDescription}>
                    Antik sokaklarda kaybol, küçük sofralarda soluklan. Roma’yı kendi ritminde
                    keşfet.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => collection('Tümü')}
                    className={[styles.between, '!py-[4px]'].filter(Boolean).join(' ')}
                  >
                    <View className={styles.row}>
                      <Text className={styles.heroLink}>Koleksiyonu keşfet</Text>
                      <Feather name="arrow-right" size={14} color="#E5EBC2" />
                    </View>
                    <Text className={[styles.heroLink, '!text-[8px]'].filter(Boolean).join(' ')}>
                      4 özel durak
                    </Text>
                  </Pressable>
                </View>
              </View>
              <View
                onLayout={(event) => {
                  sectionOffset.current = event.nativeEvent.layout.y;
                }}
                className={[styles.between, styles.section].filter(Boolean).join(' ')}
              >
                <View className="flex-1">
                  <Text accessibilityRole="header" className={styles.title}>
                    {category === 'Kaydedilenler'
                      ? 'Kaydettiğin yerler'
                      : category === 'Tümü'
                        ? 'Editörün seçtikleri'
                        : category}
                  </Text>
                  <Text className={styles.muted}>
                    Özenle seçilmiş sofralar, sanat ve küçük keşifler.
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Tüm önerileri göster"
                  onPress={() => {
                    setCategory('Tümü');
                    setQuery('');
                    setSubmittedQuery('');
                  }}
                  className="py-[10px]"
                >
                  <Text className={[styles.text, '!text-[9px]'].filter(Boolean).join(' ')}>
                    Tümü →
                  </Text>
                </Pressable>
              </View>
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  className={[styles.text, '!text-[#A54839] !mb-[12px]'].filter(Boolean).join(' ')}
                >
                  {error}
                </Text>
              )}
              {matchesCollection(saved, category, query) && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => collection('Tümü')}
                  className={[styles.quiet, '!mt-0 !mb-[16px]'].filter(Boolean).join(' ')}
                >
                  <Text className={[styles.text, '!flex-1'].filter(Boolean).join(' ')}>
                    Roma: Ebedî Şehirde altın saatler
                  </Text>
                  <Feather name="arrow-right" size={14} color={palette.green} />
                </Pressable>
              )}
              {visible.filter((place) => !place.compact).map(card)}
              <View className={styles.grid}>
                {visible.filter((place) => place.compact).map(card)}
              </View>
              {visible.length === 0 && !matchesCollection(saved, category, query) && (
                <View className={styles.empty}>
                  <Feather name="compass" size={28} color={palette.muted} />
                  <Text className={[styles.text, '!text-center'].filter(Boolean).join(' ')}>
                    {category === 'Kaydedilenler'
                      ? ready
                        ? 'Henüz bir yer kaydetmedin. Beğendiğin karttaki kaydet düğmesine dokun.'
                        : 'Kaydedilen yerler yükleniyor…'
                      : 'Aramana uygun bir yer bulunamadı.'}
                  </Text>
                </View>
              )}
              <Text
                className={[styles.muted, '!text-center !text-[8px] !mt-[9px]']
                  .filter(Boolean)
                  .join(' ')}
              >
                Örnek keşif seçkisi · Puanlar örnek, görseller temsilidir.{'\n'}Kaydettiklerin
                hesabında saklanır.
              </Text>
            </>
          )}
          <View className={styles.section}>
            <Text accessibilityRole="header" className={styles.title}>
              {countryLabel} {category === 'Konaklama' ? 'otelleri' : 'mekânları'}
            </Text>
            <Text className={styles.muted}>Yeni yerler keşfet.</Text>
          </View>
          {googleLoading && (
            <Text className={styles.muted}>
              {category === 'Konaklama' ? 'Oteller yükleniyor…' : 'Mekânlar yükleniyor…'}
            </Text>
          )}
          {!!googleMessage && <Text className={styles.muted}>{googleMessage}</Text>}
          {!googleLoading && !googleMessage && googlePlaces.length === 0 && (
            <Text className={styles.muted}>
              Bu seçim için {category === 'Konaklama' ? 'otel' : 'mekân'} bulunamadı.
            </Text>
          )}
          {googlePlaces.map((place) => (
            <GooglePlaceCard
              key={place.id}
              place={place}
              saved={saved.includes(place.id)}
              ready={ready}
              onSave={() => toggle(place.id)}
              onOpen={() => onOpenPlace(place)}
            />
          ))}
        </View>
      </ScrollView>
      <HomeBottomBar activeTab="Keşfet" onSelect={select} />
    </SafeAreaView>
  );
}
