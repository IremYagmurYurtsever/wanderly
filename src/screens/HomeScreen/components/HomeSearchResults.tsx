import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { useSavedPlaces } from '../../ExploreScreen/useSavedPlaces';
import type { HomeSearchState } from '../../../models/homeSearch';
import { palette, styles } from '../HomeScreen.styles';
import { HomePlaceSuggestion } from './HomePlaceSuggestion';
import type { GooglePlace } from '../../../repositories/googlePlaces';

type Props = {
  history: HomeSearchState;
  query: string;
  busy: boolean;
  error: string;
  onSearch: (query: string) => void;
  onOpenPlace: (place: GooglePlace) => void;
};

export function HomeSearchResults({ history, query, busy, error, onSearch, onOpenPlace }: Props) {
  const [showAll, setShowAll] = useState(false);
  const { saved, ready, error: savedError, toggle } = useSavedPlaces();
  useEffect(() => {
    setShowAll(false);
  }, [history.lastQuery]);
  const showResults =
    !!history.lastQuery &&
    query.trim().toLocaleLowerCase('tr-TR') === history.lastQuery.toLocaleLowerCase('tr-TR');

  return (
    <View className="rounded-b-[18px] border border-t-0 border-[#E7E8DF] bg-[#FFFEFA] p-3">
      {!!error && (
        <Text accessibilityRole="alert" className="mb-3 font-manrope text-[10px] text-[#A54839]">
          {error}
        </Text>
      )}
      {!!savedError && (
        <Text accessibilityRole="alert" className="mb-3 font-manrope text-[10px] text-[#A54839]">
          {savedError}
        </Text>
      )}
      {history.queries.length > 0 && (
        <View className="mb-3">
          <Text className={styles.label}>SON ARAMALARIN</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {history.queries.map((term) => (
              <Pressable
                key={term}
                accessibilityRole="button"
                accessibilityLabel={`${term} aramasını tekrar yap`}
                disabled={busy}
                onPress={() => {
                  setShowAll(false);
                  onSearch(term);
                }}
                className="flex-row items-center gap-1 rounded-full bg-[#EFF0E9] px-3 py-2"
              >
                <Feather name="clock" size={11} color={palette.green} />
                <Text className="font-manrope text-[9px] text-[#49644F]">{term}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {busy && <ActivityIndicator accessibilityLabel="Mekânlar aranıyor" color={palette.green} />}
      {showResults && (
        <View>
          <Text className={`${styles.title} mb-1 !text-[19px]`}>{history.lastQuery} sonuçları</Text>
          <Text className={`${styles.small} mb-3`}>
            {history.results.length
              ? `${history.results.length} mekân · Fotoğraf bulunamazsa temsili görsel gösterilir.`
              : 'Bu arama için mekân bulunamadı. Başka bir yer deneyebilirsin.'}
          </Text>
          {history.results.slice(0, showAll ? undefined : 3).map((place) => (
            <HomePlaceSuggestion
              key={place.id}
              place={place}
              saved={saved.includes(place.id)}
              ready={ready}
              onSave={() => toggle(place.id)}
              onOpen={() => onOpenPlace(place)}
            />
          ))}
          {!showAll && history.results.length > 3 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowAll(true)}
              className="mb-3 min-h-[42px] items-center justify-center rounded-xl bg-[#E9EEE4]"
            >
              <Text className="font-manrope-semibold text-[10px] text-[#203E35]">
                Tüm {history.results.length} sonucu göster
              </Text>
            </Pressable>
          )}
        </View>
      )}
      {!showResults && !busy && !error && (
        <Text className={styles.small}>
          {query.trim().length < 1
            ? 'Bir harf yaz; mekânlar burada görünecek.'
            : 'Yazmayı bırakınca eşleşen mekânlar burada görünecek.'}
        </Text>
      )}
    </View>
  );
}
