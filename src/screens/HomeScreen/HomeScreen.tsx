import { createTabHandler } from '../../navigation/routes';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { HomeHeader, HomeSearchBar } from './components/HomeHeader';
import { TripPlanner } from './components/TripPlanner';
import { UpcomingTrip } from './components/UpcomingTrip';
import { CurrencyExchange } from './components/CurrencyExchange';
import { HomeSearchResults } from './components/HomeSearchResults';
import { HomeBottomBar } from '../../components/HomeBottomBar';
import { palette, styles } from './HomeScreen.styles';
import { useHomeStorage } from './useHomeStorage';
import { useHomePlaceSearch } from './useHomePlaceSearch';
import type { HomeScreenProps } from './HomeScreen.types';
import { tripTiming } from '../../models/tripDates';

export function HomeScreen({ name, go, onOpenPlace, onOpenTrip }: HomeScreenProps) {
  const scroll = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { data, update, addTrip, savingTrip, ready, storageError } = useHomeStorage();
  const placeSearch = useHomePlaceSearch();
  const latestTrip =
    [...data.trips]
      .filter((trip) => tripTiming(trip).status !== 'past')
      .sort((first, second) => (first.startDate ?? '').localeCompare(second.startDate ?? ''))[0] ??
    data.trips.at(-1);
  const displayedTrips = latestTrip
    ? [
        latestTrip,
        ...data.trips
          .filter((trip) => trip.id !== latestTrip.id)
          .sort((first, second) => (first.startDate ?? '').localeCompare(second.startDate ?? '')),
      ]
    : [];

  const [planning, setPlanning] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchBarHeight, setSearchBarHeight] = useState(76);
  const [headerBlur, setHeaderBlur] = useState(0);
  const contentOffset = useRef(0);
  const plannerOffset = useRef(0);
  const headerBlurRef = useRef(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );
  function focusPlanner() {
    scroll.current?.scrollTo({
      y: contentOffset.current + plannerOffset.current - searchBarHeight - 8,
      animated: true,
    });
    setPlanning((value) => value + 1);
  }
  function searchPlaces(term: string) {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    Keyboard.dismiss();
    void placeSearch.search(term);
  }
  function changeSearchQuery(value: string) {
    placeSearch.changeQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length >= 1)
      searchTimer.current = setTimeout(() => {
        void placeSearch.search(value);
      }, 800);
  }
  const selectTab = createTabHandler('Ana Sayfa', go, () =>
    scroll.current?.scrollTo({ y: 0, animated: true }),
  );
  if (!ready)
    return (
      <View className={[styles.page, '!items-center !justify-center'].filter(Boolean).join(' ')}>
        <ActivityIndicator
          color={palette.green}
          accessibilityLabel="Kaydedilen planlar yükleniyor"
        />
      </View>
    );
  return (
    <SafeAreaView edges={[]} className={styles.page}>
      <ScrollView
        className="flex-1"
        automaticallyAdjustKeyboardInsets
        ref={scroll}
        stickyHeaderIndices={[0]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="pb-2"
        scrollEventThrottle={32}
        onScroll={(event) => {
          const offset = event.nativeEvent.contentOffset.y;
          const next = offset < 16 ? 0 : offset < 56 ? 18 : offset < 112 ? 32 : 46;
          if (next !== headerBlurRef.current) {
            headerBlurRef.current = next;
            setHeaderBlur(next);
          }
        }}
      >
        <View
          className="z-10 px-[22px] pb-[6px]"
          style={{ paddingTop: insets.top + 12 }}
          onLayout={(event) => {
            setSearchBarHeight(event.nativeEvent.layout.height);
          }}
        >
          {headerBlur > 0 && (
            <BlurView
              pointerEvents="none"
              intensity={headerBlur}
              tint="systemUltraThinMaterialLight"
              className="absolute inset-0 bg-[#F8F7F21A]"
            />
          )}
          <HomeSearchBar
            name={name}
            query={placeSearch.query}
            searchReady={placeSearch.ready}
            searching={placeSearch.busy}
            searchOpen={searchOpen}
            onChangeQuery={changeSearchQuery}
            onOpenSearch={() => {
              setSearchOpen(true);
            }}
            onCloseSearch={() => {
              if (searchTimer.current) clearTimeout(searchTimer.current);
              Keyboard.dismiss();
              setSearchOpen(false);
            }}
            onSubmitSearch={() => searchPlaces(placeSearch.query)}
            onProfile={() => selectTab('Profil')}
          />
          {searchOpen && (
            <ScrollView
              className="absolute left-[22px] right-[22px] z-20"
              style={{ top: searchBarHeight - 6, maxHeight: Math.max(180, windowHeight * 0.65) }}
              keyboardShouldPersistTaps="always"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <HomeSearchResults
                history={placeSearch.history}
                query={placeSearch.query}
                busy={placeSearch.busy}
                error={placeSearch.error}
                onSearch={searchPlaces}
                onOpenPlace={onOpenPlace}
              />
            </ScrollView>
          )}
        </View>
        <HomeHeader overlap={searchBarHeight} />
        <View
          className={styles.content}
          onLayout={(event) => {
            contentOffset.current = event.nativeEvent.layout.y;
          }}
        >
          {!!storageError && (
            <Text
              accessibilityRole="alert"
              className={[styles.small, '!text-[#A54839] !mb-[12px]'].filter(Boolean).join(' ')}
            >
              {storageError}
            </Text>
          )}
          <View
            onLayout={(event) => {
              plannerOffset.current = event.nativeEvent.layout.y;
            }}
          >
            <TripPlanner
              data={data}
              update={update}
              searching={planning}
              busy={savingTrip}
              onPlan={async (next) => {
                const savedTrip = await addTrip(next);
                if (savedTrip) onOpenTrip(savedTrip);
              }}
            />
          </View>
          {latestTrip ? (
            <>
              {displayedTrips.map((trip, index) => (
                <UpcomingTrip
                  key={trip.id}
                  count={index === 0 ? data.trips.length : undefined}
                  trip={trip}
                  onDetails={() => onOpenTrip(trip)}
                  onAll={() => go('trips')}
                />
              ))}
            </>
          ) : (
            <View className={`${styles.card} mt-[25px] items-center`}>
              <View className={styles.iconCircle}>
                <Feather name="map" size={17} color={palette.green} />
              </View>
              <Text className={`${styles.title} mt-3`}>Henüz bir gezi planın yok</Text>
              <Text className={`${styles.small} mt-2 text-center leading-[17px]`}>
                Ülkeni ve tarihlerini yukarıdan seç. Planın hesabında saklanacak.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={focusPlanner}
                className={`${styles.button} mt-4`}
              >
                <Text className={styles.buttonText}>İlk gezini planla</Text>
              </Pressable>
            </View>
          )}
          <CurrencyExchange data={data} update={update} />
        </View>
      </ScrollView>
      <HomeBottomBar activeTab="Ana Sayfa" onSelect={selectTab} />
    </SafeAreaView>
  );
}
