import { ScreenHeader } from '../../components/ScreenHeader';
import { createTabHandler } from '../../navigation/routes';
import { useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { HomeBottomBar } from '../../components/HomeBottomBar';
import { MemoryEditor } from '../../components/MemoryEditor';
import { AppModal } from '../../components/AppModal';
import type { Notice, Screen } from '../../types';
import type { SavedTrip } from '../../models/trip';
import { tripTiming } from '../../models/tripDates';
import {
  defaultJournalDay,
  type JournalEntry,
  formatDate,
  journalTripDays,
} from './JournalScreen.data';
import { JournalCard } from './components/JournalCard';
import { JournalDatePicker } from './components/JournalDatePicker';
import { JournalTripCard } from './components/JournalTripCard';
import { palette, styles } from './JournalScreen.styles';
import { useJournal } from './useJournal';

type JournalScreenProps = {
  name: string;
  go: (screen: Screen) => void;
  setNotice: (notice: Notice) => void;
  pendingPlace: { id: string; title: string } | null;
  onPendingPlaceHandled: () => void;
  requestedTripId: string | null;
  onRequestedTripHandled: () => void;
};

export function JournalScreen({
  name,
  go,
  setNotice,
  pendingPlace,
  onPendingPlaceHandled,
  requestedTripId,
  onRequestedTripHandled,
}: JournalScreenProps) {
  const { entries, trips, tripsLoading, favorites, ready, error, refresh, toggleFavorite } =
    useJournal();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [placeDraft, setPlaceDraft] = useState<{
    id: string;
    title: string;
    date: string;
    tripId: string;
  } | null>(null);
  const [readingEntry, setReadingEntry] = useState<JournalEntry | null>(null);
  const [photo, setPhoto] = useState<ImageSourcePropType | null>(null);
  const scroll = useRef<ScrollView>(null);
  const autoOpened = useRef(false);
  useEffect(() => {
    if (pendingPlace || requestedTripId) {
      autoOpened.current = true;
      return;
    }
    if (autoOpened.current || trips.length === 0) return;
    autoOpened.current = true;
    const ongoing = trips.find((trip) => tripTiming(trip).status === 'ongoing');
    if (ongoing) {
      setSelectedJournal(ongoing.id);
      setSelectedDay(defaultJournalDay(journalTripDays(ongoing)));
    }
  }, [pendingPlace, requestedTripId, trips]);
  useEffect(() => {
    if (!requestedTripId) return;
    const trip = trips.find((item) => item.id === requestedTripId);
    if (!trip) return;
    autoOpened.current = true;
    setSelectedJournal(trip.id);
    setSelectedDay(defaultJournalDay(journalTripDays(trip)));
    onRequestedTripHandled();
  }, [requestedTripId, trips, onRequestedTripHandled]);
  const activeTrip = trips.find((trip) => trip.id === selectedJournal);
  const orphanedEntries = entries.filter(
    (entry) => !entry.tripId || !trips.some((trip) => trip.id === entry.tripId),
  );
  const journalEntries = activeTrip
    ? entries.filter((entry) => entry.tripId === activeTrip.id)
    : selectedJournal === 'legacy'
      ? orphanedEntries
      : [];
  const days = activeTrip ? journalTripDays(activeTrip) : [];
  const writtenDates = [...new Set(journalEntries.map((entry) => entry.date.slice(0, 10)))]
    .sort()
    .reverse();
  const dayOptions = days.length ? [...new Set([...days, ...writtenDates])].sort() : writtenDates;
  const currentDay =
    selectedDay && (dayOptions.length === 0 || dayOptions.includes(selectedDay))
      ? selectedDay
      : defaultJournalDay(dayOptions);
  const visible = journalEntries
    .filter(
      (entry) =>
        (selectedJournal === 'legacy' || entry.date.slice(0, 10) === currentDay) &&
        `${entry.title} ${entry.text} ${entry.city} ${entry.placeName ?? ''}`
          .toLocaleLowerCase('tr-TR')
          .includes(query.trim().toLocaleLowerCase('tr-TR')),
    )
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) || second.createdAt.localeCompare(first.createdAt),
    );
  const journals = [...trips].sort(
    (first, second) =>
      Number(tripTiming(second).status === 'ongoing') -
        Number(tripTiming(first).status === 'ongoing') ||
      (second.startDate ?? '').localeCompare(first.startDate ?? ''),
  );
  const matchingJournals = journals.filter((trip) =>
    trip.destination.toLocaleLowerCase('tr-TR').includes(query.trim().toLocaleLowerCase('tr-TR')),
  );
  const plannedStops = [
    ...new Map((activeTrip?.stops ?? []).map((stop) => [stop.placeId, stop])).values(),
  ];

  const select = createTabHandler('Günlüğüm', go, () => {
    if (selectedJournal) setSelectedJournal(null);
    else scroll.current?.scrollTo({ y: 0, animated: true });
  });

  function openJournal(trip: SavedTrip) {
    setSelectedJournal(trip.id);
    setSelectedDay(defaultJournalDay(journalTripDays(trip)));
    setDatePickerOpen(!!pendingPlace && journalTripDays(trip).length === 0);
    setQuery('');
    setSearchOpen(false);
    scroll.current?.scrollTo({ y: 0, animated: true });
  }

  function startDraft(date: string, title = '') {
    if (!activeTrip) return;
    setPlaceDraft({
      id: pendingPlace?.id ?? (title || 'note'),
      title,
      date,
      tripId: activeTrip.id,
    });
    setDatePickerOpen(false);
    if (pendingPlace) onPendingPlaceHandled();
  }

  async function share(entry: JournalEntry) {
    try {
      await Share.share({
        title: entry.title,
        message: `${entry.title}\n${entry.city} · ${formatDate(entry.date)}\n\n${entry.text}`,
      });
    } catch {
      setNotice({
        title: 'Paylaşım açılamadı',
        body: 'Bu cihaz veya tarayıcı paylaşımı desteklemiyor olabilir. Daha sonra tekrar deneyebilirsin.',
      });
    }
  }

  return (
    <SafeAreaView edges={['top']} className={styles.page}>
      <ScrollView
        ref={scroll}
        className="flex-1"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <ScreenHeader
          name={name}
          searchOpen={searchOpen}
          onSearch={() => {
            setSearchOpen(!searchOpen);
            setQuery('');
          }}
          onProfile={() => select('Profil')}
        />
        {!selectedJournal ? (
          <>
            <View className={styles.intro}>
              <Text className={[styles.label, '!text-[#A69C6D]'].filter(Boolean).join(' ')}>
                WANDERLY · KİŞİSEL DEFTERİN
              </Text>
              <Text
                accessibilityRole="header"
                className="mt-1 font-garamond text-[34px] text-[#203E35]"
              >
                Tatil günlüklerin
              </Text>
              <Text className={styles.small}>
                Her yolculuk ayrı bir defter. Günlerini, mekânlarını ve fotoğraflarını sakla.
              </Text>
            </View>
            {pendingPlace && (
              <View className="mb-4 rounded-2xl bg-[#EAF0DF] p-4">
                <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                  {pendingPlace.title} hangi tatilin günlüğüne eklensin?
                </Text>
                <Text className="mt-1 font-manrope text-[9px] text-[#66756A]">
                  Önce tatili, sonra günü seç.
                </Text>
              </View>
            )}
            {searchOpen && (
              <TextInput
                autoFocus
                accessibilityLabel="Tatil günlüğü araması"
                placeholder="Bir tatil ara…"
                value={query}
                onChangeText={setQuery}
                className={styles.search}
                placeholderTextColor={palette.muted}
              />
            )}
            {!!error && (
              <Pressable
                onPress={() => void refresh()}
                className="mb-3 rounded-xl bg-[#F9E9E4] p-3"
              >
                <Text accessibilityRole="alert" className="font-manrope text-[10px] text-[#A54839]">
                  {error} · Tekrar dene
                </Text>
              </Pressable>
            )}
            {matchingJournals.map((trip) => {
              const tripEntries = entries.filter((entry) => entry.tripId === trip.id);
              return (
                <JournalTripCard
                  key={trip.id}
                  trip={trip}
                  memoryCount={tripEntries.length}
                  photoCount={tripEntries.filter((entry) => entry.photos.length > 0).length}
                  onOpen={() => openJournal(trip)}
                />
              );
            })}
            {orphanedEntries.length > 0 && !pendingPlace && (
              <Pressable
                accessibilityRole="button"
                onPress={() => setSelectedJournal('legacy')}
                className="mb-3 flex-row items-center justify-between rounded-2xl border border-[#E1E8DA] bg-[#FFFDF9] p-4"
              >
                <View>
                  <Text className="font-garamond text-[23px] text-[#203E35]">Bağımsız notlar</Text>
                  <Text className="font-manrope text-[9px] text-[#778078]">
                    {orphanedEntries.length} eski anı · silinmeden korundu
                  </Text>
                </View>
                <Feather name="arrow-right" size={16} color="#49644F" />
              </Pressable>
            )}
            {tripsLoading && (
              <Text className="font-manrope text-[10px] text-[#778078]">
                Tatil günlükleri yükleniyor…
              </Text>
            )}
            {!tripsLoading && trips.length === 0 && orphanedEntries.length === 0 && (
              <View className="items-center gap-3 rounded-2xl bg-[#EFF1E8] p-6">
                <Feather name="map" size={24} color={palette.green} />
                <Text className="text-center font-manrope text-[11px] text-[#203E35]">
                  Henüz bir tatil defterin yok. Gezi planı kaydedince günlüğü burada otomatik
                  açılır.
                </Text>
                <Pressable onPress={() => go('trips')} className={styles.button}>
                  <Text className={styles.buttonText}>Gezilerime git</Text>
                </Pressable>
              </View>
            )}
          </>
        ) : (
          <>
            <View className="mt-5 flex-row items-center gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Tatil günlüklerine dön"
                onPress={() => {
                  setSelectedJournal(null);
                  setDatePickerOpen(false);
                  setQuery('');
                }}
                className="h-10 w-10 items-center justify-center rounded-full bg-[#E9EEE4]"
              >
                <Feather name="arrow-left" size={18} color="#203E35" />
              </Pressable>
              <View className="flex-1">
                <Text
                  accessibilityRole="header"
                  className="font-garamond text-[28px] text-[#203E35]"
                >
                  {activeTrip ? `${activeTrip.destination} tatili` : 'Bağımsız notlar'}
                </Text>
                {activeTrip && <Text className={styles.small}>{activeTrip.dates}</Text>}
              </View>
              {activeTrip && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={visible.length > 0 ? 'Bu günün notunu aç' : 'Bu güne not yaz'}
                  onPress={() => {
                    if (visible.length > 0) {
                      setEditingEntry(visible[0]);
                    } else if (days.length) {
                      startDraft(currentDay, pendingPlace?.title ?? '');
                    } else {
                      setDatePickerOpen(true);
                    }
                  }}
                  className={styles.button}
                >
                  <Feather name="edit-3" size={12} color="white" />
                  <Text className={styles.buttonText}>
                    {visible.length > 0 ? 'Notu aç' : 'Not yaz'}
                  </Text>
                </Pressable>
              )}
            </View>
            {activeTrip && tripTiming(activeTrip).status === 'ongoing' && (
              <Text className="mt-3 self-start rounded-full bg-[#DCE9D4] px-3 py-1 font-manrope-semibold text-[9px] text-[#49644F]">
                Devam eden yolculuk · bugünün sayfası açık
              </Text>
            )}
            {datePickerOpen && activeTrip && (
              <View className="mt-4">
                <JournalDatePicker
                  tripName={activeTrip.destination}
                  placeName={pendingPlace?.title}
                  initialDate={activeTrip.startDate ?? undefined}
                  dates={writtenDates}
                  onClose={() => {
                    setDatePickerOpen(false);
                    if (pendingPlace) onPendingPlaceHandled();
                  }}
                  onSelect={(date) => {
                    setSelectedDay(date);
                    setDatePickerOpen(false);
                    const dayEntries = journalEntries.filter(
                      (entry) => entry.date.slice(0, 10) === date,
                    );
                    if (!pendingPlace && dayEntries.length > 0) {
                      return;
                    }
                    startDraft(date, pendingPlace?.title ?? '');
                  }}
                />
              </View>
            )}
            {pendingPlace && activeTrip && days.length > 0 && (
              <View className="mt-4 rounded-2xl bg-[#EAF0DF] p-4">
                <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                  {pendingPlace.title} anısını hangi güne ekleyelim?
                </Text>
                <Text className="mt-1 font-manrope text-[9px] text-[#66756A]">
                  Aşağıdan günü seç, ardından anını ve fotoğrafını ekle.
                </Text>
                <Pressable
                  onPress={() => startDraft(currentDay, pendingPlace.title)}
                  className="mt-3 self-start rounded-xl bg-[#203E35] px-4 py-3"
                >
                  <Text className="font-manrope-semibold text-[10px] text-white">
                    {formatDate(currentDay)} gününe ekle
                  </Text>
                </Pressable>
              </View>
            )}
            {activeTrip && dayOptions.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="gap-2 py-5"
              >
                {dayOptions.map((day) => {
                  const dayEntries = journalEntries.filter(
                    (entry) => entry.date.slice(0, 10) === day,
                  );
                  const isSelected = currentDay === day;
                  return (
                    <Pressable
                      key={day}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      onPress={() => {
                        setSelectedDay(day);
                        if (isSelected && dayEntries.length > 0) {
                          setReadingEntry(dayEntries[0]);
                        }
                      }}
                      className={`min-w-[82px] rounded-xl px-3 py-3 ${isSelected ? 'bg-[#203E35]' : 'bg-[#E9EEE4]'}`}
                    >
                      <Text
                        className={`font-manrope-semibold text-[10px] ${isSelected ? 'text-white' : 'text-[#203E35]'}`}
                      >
                        {days.includes(day) ? `${days.indexOf(day) + 1}. gün` : formatDate(day)}
                      </Text>
                      {days.includes(day) && (
                        <Text
                          className={`mt-1 font-manrope text-[9px] ${isSelected ? 'text-[#DDE8D9]' : 'text-[#778078]'}`}
                        >
                          {formatDate(day)}
                        </Text>
                      )}
                      <Text
                        className={`mt-1 font-manrope text-[8px] ${isSelected ? 'text-[#DDE8D9]' : 'text-[#778078]'}`}
                      >
                        {dayEntries.length} anı
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            {activeTrip && (
              <View className="mb-3 rounded-[20px] border border-[#E5E8DB] bg-[#FFFDF8] p-5">
                <Text className="font-manrope-semibold text-[8px] tracking-[1.4px] text-[#A69C6D]">
                  {days.includes(currentDay)
                    ? `${days.indexOf(currentDay) + 1}. GÜN · ${formatDate(currentDay).toLocaleUpperCase('tr-TR')}`
                    : formatDate(currentDay).toLocaleUpperCase('tr-TR')}
                </Text>
                <Text className="mt-2 font-garamond text-[28px] text-[#203E35]">
                  {visible.length ? 'Bugünün anıları' : 'Bugünün sayfası seni bekliyor'}
                </Text>
                <Text className="mt-1 font-manrope text-[10px] leading-[18px] text-[#778078]">
                  {visible.length
                    ? `${visible.length} anı bu günde kayıtlı. Yazdıklarını hemen aşağıda görebilir veya düzenleyebilirsin.`
                    : 'Gördüğün yerleri, hissettiklerini ve en sevdiğin fotoğrafı buraya bırak.'}
                </Text>
                <View className="mt-4 flex-row flex-wrap items-center gap-2">
                  {visible.length > 0 ? (
                    <>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Yazdığın anıyı düzenle"
                        onPress={() => setEditingEntry(visible[0])}
                        className="flex-row items-center gap-2 rounded-full bg-[#203E35] px-4 py-3"
                      >
                        <Feather name="edit-3" size={14} color="white" />
                        <Text className="font-manrope-semibold text-[10px] text-white">
                          Anıyı düzenle
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Bu güne yeni bir anı ekle"
                        onPress={() => {
                          if (days.length) startDraft(currentDay, pendingPlace?.title ?? '');
                          else setDatePickerOpen(true);
                        }}
                        className="flex-row items-center gap-2 rounded-full border border-[#203E35] bg-transparent px-4 py-3"
                      >
                        <Feather name="plus" size={14} color="#203E35" />
                        <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                          Yeni anı ekle
                        </Text>
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Bu güne anı ekle"
                      onPress={() => {
                        if (days.length) startDraft(currentDay, pendingPlace?.title ?? '');
                        else setDatePickerOpen(true);
                      }}
                      className="flex-row items-center gap-2 self-start rounded-full bg-[#203E35] px-4 py-3"
                    >
                      <Feather name="plus" size={14} color="white" />
                      <Text className="font-manrope-semibold text-[10px] text-white">
                        Bu güne anı ekle
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}
            {searchOpen && (
              <TextInput
                autoFocus
                accessibilityLabel="Günlük anısı araması"
                placeholder="Bir anı veya mekân ara…"
                value={query}
                onChangeText={setQuery}
                className={styles.search}
                placeholderTextColor={palette.muted}
              />
            )}
            {!!error && (
              <Pressable
                onPress={() => void refresh()}
                className="mb-3 rounded-xl bg-[#F9E9E4] p-3"
              >
                <Text accessibilityRole="alert" className="font-manrope text-[10px] text-[#A54839]">
                  {error} · Tekrar dene
                </Text>
              </Pressable>
            )}
            {activeTrip && visible.length > 0 && (
              <View className="mb-3 mt-4 flex-row items-center justify-between">
                <Text className="font-garamond text-[23px] text-[#203E35]">Yazdıkların</Text>
                <Text className="font-manrope text-[9px] text-[#778078]">{visible.length} anı</Text>
              </View>
            )}
            {visible.map((entry, index) => (
              <View key={entry.id}>
                {selectedJournal === 'legacy' &&
                  (index === 0 ||
                    visible[index - 1].date.slice(0, 10) !== entry.date.slice(0, 10)) && (
                    <Text className="mb-3 mt-2 font-garamond text-[23px] text-[#203E35]">
                      {formatDate(entry.date)}
                    </Text>
                  )}
                <JournalCard
                  entry={entry}
                  liked={favorites.includes(`personal-${entry.id}`)}
                  ready={ready}
                  onLike={() => toggleFavorite(`personal-${entry.id}`)}
                  onShare={() => void share(entry)}
                  onPhoto={setPhoto}
                  onOpen={() => setReadingEntry(entry)}
                  onEdit={() => setEditingEntry(entry)}
                />
              </View>
            ))}
            {activeTrip && visible.length === 0 && (
              <View className="items-center gap-3 p-6">
                <Feather name="book-open" size={26} color={palette.muted} />
                <Text className="text-center font-manrope text-[11px] text-[#778078]">
                  {journalEntries.length === 0
                    ? 'Bu tatilin günlüğü henüz boş. İlk anını bu güne yazabilirsin.'
                    : 'Bu gün veya filtre için henüz anı yok.'}
                </Text>
              </View>
            )}
            {activeTrip && plannedStops.length > 0 && (
              <View className="mt-6">
                <Text className="font-garamond text-[24px] text-[#203E35]">Planladığın yerler</Text>
                <Text className="mb-3 font-manrope text-[9px] text-[#778078]">
                  Ziyaret ettiğin bir yeri seçip bu günün anısını yazabilirsin.
                </Text>
                {plannedStops.map((stop) => (
                  <Pressable
                    key={stop.placeId}
                    accessibilityRole="button"
                    accessibilityLabel={`${stop.title} hakkında anı yaz`}
                    onPress={() => startDraft(currentDay, stop.title)}
                    className="mb-2 flex-row items-center gap-3 rounded-xl border border-[#E5E9DF] bg-white p-3"
                  >
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-[#EAF0DF]">
                      <Feather
                        name={stop.kind === 'hotel' ? 'home' : 'map-pin'}
                        size={15}
                        color="#49644F"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                        {stop.title}
                      </Text>
                      <Text numberOfLines={1} className="font-manrope text-[8px] text-[#778078]">
                        {stop.kind === 'hotel' ? 'Konaklama' : 'Gezilecek yer'} · {stop.address}
                      </Text>
                    </View>
                    <Feather name="plus" size={16} color="#49644F" />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
        <Text
          className={[styles.small, '!text-center !mt-[15px] !text-[8px]']
            .filter(Boolean)
            .join(' ')}
        >
          Anıların ve fotoğrafların hesabına özel saklanır.
        </Text>
      </ScrollView>
      <HomeBottomBar activeTab="Günlüğüm" onSelect={select} />
      {placeDraft && (
        <MemoryEditor
          key={`${placeDraft.tripId}-${placeDraft.id}-${placeDraft.date}`}
          trips={trips}
          fixedTrip={trips.find((trip) => trip.id === placeDraft.tripId)}
          initialPlaceName={placeDraft.title}
          initialVisitedAt={placeDraft.date}
          onClose={() => setPlaceDraft(null)}
          onSaved={(savedDate) => {
            const dateToSelect = savedDate || placeDraft.date;
            setSelectedDay(dateToSelect);
            setPlaceDraft(null);
            setQuery('');
            void refresh();
            setNotice({
              title: 'Anın günlüğe kaydedildi',
              body: `${placeDraft.title ? `${placeDraft.title} hakkındaki notun` : 'Notun'} ${formatDate(dateToSelect)} gününe eklendi.`,
            });
          }}
        />
      )}
      {editingEntry && (
        <MemoryEditor
          memory={editingEntry}
          trips={trips}
          fixedTrip={activeTrip}
          onClose={() => setEditingEntry(null)}
          onSaved={(savedDate) => {
            if (savedDate) setSelectedDay(savedDate);
            setEditingEntry(null);
            void refresh();
          }}
          onDeleted={() => {
            setEditingEntry(null);
            void refresh();
          }}
        />
      )}
      {readingEntry && (
        <AppModal
          title={readingEntry.title}
          onClose={() => setReadingEntry(null)}
          footer={
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEditingEntry(readingEntry);
                setReadingEntry(null);
              }}
              className="items-center rounded-xl bg-[#203E35] p-3"
            >
              <Text className="font-manrope-semibold text-[11px] text-white">Anıyı düzenle</Text>
            </Pressable>
          }
        >
          <Text className="mb-3 font-manrope text-[10px] text-[#8B9389]">
            {readingEntry.city} · {formatDate(readingEntry.date)}
            {readingEntry.placeName ? ` · ${readingEntry.placeName}` : ''}
          </Text>
          {readingEntry.photoDataUrl && (
            <Image
              source={{ uri: readingEntry.photoDataUrl }}
              className="mb-4 h-[210px] w-full rounded-xl"
              resizeMode="cover"
            />
          )}
          <Text className="font-manrope text-[12px] leading-6 text-[#203E35]">
            {readingEntry.text}
          </Text>
        </AppModal>
      )}
      <Modal
        visible={photo !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPhoto(null)}
      >
        <SafeAreaView className={styles.overlay}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı kapat"
            onPress={() => setPhoto(null)}
            className={[styles.icon, '!self-flex-end !mb-[15px]'].filter(Boolean).join(' ')}
          >
            <Feather name="x" size={24} color="white" />
          </Pressable>
          {photo && (
            <Image
              source={photo}
              resizeMode="contain"
              className={styles.lightbox}
              accessibilityLabel="Günlük fotoğrafı"
            />
          )}
          <Text
            className={[styles.small, '!text-center !mt-[15px] !text-[#DAE0D6]']
              .filter(Boolean)
              .join(' ')}
          >
            Yolculuktan bir kare
          </Text>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
