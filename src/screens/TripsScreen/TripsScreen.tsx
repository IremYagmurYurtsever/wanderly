import { HomeSearchBar } from '../HomeScreen/components/HomeHeader';
import { createTabHandler } from '../../navigation/routes';
import { useRef, useState } from 'react';
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { HomeBottomBar } from '../../components/HomeBottomBar';
import { ActiveJourneyCard, PastJourneyCard, UpcomingJourneyCard } from './components/JourneyCards';
import { useTrips } from './useTrips';
import { muted, styles } from './TripsScreen.styles';
import type { TripFilter, TripsScreenProps } from './TripsScreen.types';

const filters: { key: TripFilter; title: string }[] = [
  { key: 'all', title: 'Tümü' },
  { key: 'ongoing', title: 'Devam eden' },
  { key: 'upcoming', title: 'Yaklaşan' },
  { key: 'past', title: 'Geçmiş' },
];

export function TripsScreen({ name, go, onOpenTrip, onPlanTrip }: TripsScreenProps) {
  const { items, error, loading } = useTrips();
  const [filter, setFilter] = useState<TripFilter>('all');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const scroll = useRef<ScrollView>(null);
  const visible = items.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      `${item.title} ${item.location}`
        .toLocaleLowerCase('tr-TR')
        .includes(query.trim().toLocaleLowerCase('tr-TR')),
  );
  const select = createTabHandler('Gezilerim', go, () =>
    scroll.current?.scrollTo({ y: 0, animated: true }),
  );
  return (
    <SafeAreaView edges={['top']} className={styles.screen}>
      <ScrollView
        ref={scroll}
        className="flex-1"
        automaticallyAdjustKeyboardInsets
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="z-10 bg-[#FAF9F5] px-[22px] py-2">
          <HomeSearchBar
            name={name}
            query={query}
            searchReady
            searching={false}
            searchOpen={searchOpen}
            placeholder="Bir ülke veya yolculuk ara"
            onChangeQuery={setQuery}
            onOpenSearch={() => setSearchOpen(true)}
            onCloseSearch={() => {
              setSearchOpen(false);
              setQuery('');
              Keyboard.dismiss();
            }}
            onSubmitSearch={() => Keyboard.dismiss()}
            onProfile={() => select('Profil')}
          />
        </View>
        <View className={styles.content}>
          <View className={[styles.between, '!mt-[24px] !mb-[20px]'].filter(Boolean).join(' ')}>
            <View>
              <Text
                accessibilityRole="header"
                className={[styles.title, '!text-[33px]'].filter(Boolean).join(' ')}
              >
                Yolculukların
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onPlanTrip}
              className="flex-row items-center gap-[4px] px-[12px] py-[9px] rounded-[20px] bg-[#526A50]"
            >
              <Feather name="plus" size={12} color="white" />
              <Text className={[styles.buttonText, '!text-[9px]'].filter(Boolean).join(' ')}>
                Gezi planla
              </Text>
            </Pressable>
          </View>
          <View className="flex-row rounded-[25px] bg-[#ECEEE6] p-[4px]">
            {filters.map(({ key, title }) => (
              <Pressable
                key={key}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === key }}
                accessibilityLabel={`${title} geziler`}
                onPress={() => setFilter(key)}
                className={`flex-1 rounded-[20px] items-center justify-center py-[11px] ${filter === key ? 'bg-[#203E35]' : 'bg-transparent'}`}
              >
                <Text
                  className={`${styles.small} text-[8px] ${filter === key ? '!text-white' : '!text-[#859083]'}`}
                >
                  {title} (
                  {key === 'all'
                    ? items.length
                    : items.filter((item) => item.status === key).length}
                  )
                </Text>
              </Pressable>
            ))}
          </View>
          {!!error && (
            <Text
              accessibilityRole="alert"
              className={[styles.small, '!text-[#A54839] !mt-[12px]'].filter(Boolean).join(' ')}
            >
              {error}
            </Text>
          )}
          {loading && (
            <ActivityIndicator
              className="mt-7"
              color={muted}
              accessibilityLabel="Geziler yükleniyor"
            />
          )}
          {visible.some((item) => item.status === 'ongoing') && (
            <View className={styles.section}>
              <View className={[styles.between, '!mb-[12px]'].filter(Boolean).join(' ')}>
                <View className={[styles.row, '!gap-[7px]'].filter(Boolean).join(' ')}>
                  <View className="w-[6px] h-[6px] rounded-[3px] bg-[#B87E4F]" />
                  <Text className={styles.title}>Yolculuk devam ediyor</Text>
                </View>
              </View>
              {visible
                .filter((item) => item.status === 'ongoing')
                .map((item) => (
                  <ActiveJourneyCard
                    key={item.id}
                    journey={item}
                    onOpen={() => onOpenTrip(item.trip)}
                  />
                ))}
            </View>
          )}
          {visible.some((item) => item.status === 'upcoming') && (
            <View className={styles.section}>
              <View className={[styles.between, '!mb-[13px]'].filter(Boolean).join(' ')}>
                <Text className={styles.title}>Sıradaki keşifler</Text>
                <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
                  {visible.filter((item) => item.status === 'upcoming').length} yolculuk seni
                  bekliyor
                </Text>
              </View>
              {visible
                .filter((item) => item.status === 'upcoming')
                .map((item) => (
                  <UpcomingJourneyCard
                    key={item.id}
                    journey={item}
                    onOpen={() => onOpenTrip(item.trip)}
                  />
                ))}
            </View>
          )}
          {visible.some((item) => item.status === 'past') && (
            <View className={styles.section}>
              <View className={[styles.between, '!mb-[13px]'].filter(Boolean).join(' ')}>
                <Text className={styles.title}>Geçmişten anılar</Text>
                <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
                  {visible.filter((item) => item.status === 'past').length} anı dosyası
                </Text>
              </View>
              {visible
                .filter((item) => item.status === 'past')
                .map((item) => (
                  <PastJourneyCard
                    key={item.id}
                    journey={item}
                    onOpen={() => onOpenTrip(item.trip)}
                  />
                ))}
            </View>
          )}
          {!loading && visible.length === 0 && (
            <View className="p-[32px] items-center">
              <Feather name="map" size={25} color={muted} />
              <Text className={[styles.text, '!mt-[12px]'].filter(Boolean).join(' ')}>
                {items.length === 0
                  ? 'Henüz bir gezi planın yok. İlk yolculuğunu planla.'
                  : 'Bu aramaya uygun gezi bulunamadı.'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <HomeBottomBar activeTab="Gezilerim" onSelect={select} />
    </SafeAreaView>
  );
}
