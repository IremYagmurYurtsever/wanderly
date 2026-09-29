import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppModal } from './AppModal';
import { googlePlacesRepository } from '../repositories/googlePlaces';
import { memoryRepository } from '../repositories';
import type { Memory, MemoryDraft } from '../models/memory';
import type { SavedTrip } from '../models/trip';
import { todayIso, validIsoDate } from '../models/tripDates';

export function MemoryEditor({
  onClose,
  onSaved,
  onDeleted,
  memory,
  trips = [],
  fixedTrip,
  initialText = '',
  initialPlaceName = '',
  initialVisitedAt,
}: {
  onClose: () => void;
  onSaved: (savedVisitedAt?: string) => void;
  onDeleted?: () => void;
  memory?: Memory;
  trips?: SavedTrip[];
  fixedTrip?: SavedTrip;
  initialText?: string;
  initialPlaceName?: string;
  initialVisitedAt?: string;
}) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState(memory?.text ?? initialText);
  const [tripId, setTripId] = useState<string | null>(memory?.tripId ?? fixedTrip?.id ?? null);
  const [placeName, setPlaceName] = useState(memory?.placeName ?? initialPlaceName);
  const [placeSearchOpen, setPlaceSearchOpen] = useState(false);
  const [placeSearchTerm, setPlaceSearchTerm] = useState('');
  const [visitedAt, setVisitedAt] = useState(memory?.visitedAt ?? initialVisitedAt ?? todayIso());
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(memory?.photoDataUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const saving = useRef(false);
  const selectedTrip = fixedTrip ?? trips.find((trip) => trip.id === tripId);
  const normalizedPlaceName = placeName.trim().toLocaleLowerCase('tr-TR');
  const placeSearchPending = placeName.trim().length >= 2 && placeName.trim() !== placeSearchTerm;
  const plannedPlaces = (selectedTrip?.stops ?? [])
    .filter((stop) => stop.title.toLocaleLowerCase('tr-TR').includes(normalizedPlaceName))
    .slice(0, 5);
  useEffect(() => {
    if (!placeSearchOpen || placeName.trim().length < 2) {
      setPlaceSearchTerm('');
      return;
    }
    const timeout = setTimeout(() => setPlaceSearchTerm(placeName.trim()), 500);
    return () => clearTimeout(timeout);
  }, [placeName, placeSearchOpen]);
  const placeSearch = useQuery({
    queryKey: ['places', 'journal-search', placeSearchTerm],
    queryFn: () => googlePlacesRepository.searchAny(placeSearchTerm),
    enabled: placeSearchOpen && placeSearchTerm.length >= 2,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  const onlinePlaces = (placeName.trim() === placeSearchTerm ? (placeSearch.data ?? []) : [])
    .filter(
      (place) =>
        !plannedPlaces.some(
          (stop) =>
            stop.title.toLocaleLowerCase('tr-TR') === place.title.toLocaleLowerCase('tr-TR'),
        ),
    )
    .slice(0, 5);
  async function pickPhoto() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        base64: true,
        quality: 0.3,
      });
      if (result.canceled) return;
      const base64 = result.assets[0]?.base64;
      if (!base64) throw new Error('Fotoğraf okunamadı.');
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      if (dataUrl.length > 1_500_000)
        throw new Error('Fotoğraf çok büyük. Daha küçük bir fotoğraf seç.');
      setPhotoDataUrl(dataUrl);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Fotoğraf seçilemedi.');
    }
  }
  async function save() {
    if (saving.current) return;
    if (!note.trim()) {
      setError('Kaydetmek için kısa bir anı yaz.');
      return;
    }
    if (!validIsoDate(visitedAt.trim())) {
      setError('Tarihi YYYY-AA-GG biçiminde yaz.');
      return;
    }
    saving.current = true;
    setBusy(true);
    try {
      const draft: MemoryDraft = {
        text: note.trim(),
        tripId: fixedTrip?.id ?? tripId,
        placeName: placeName.trim() || null,
        visitedAt: visitedAt.trim(),
        photoDataUrl,
      };
      if (memory) await memoryRepository.update(memory.id, draft);
      else await memoryRepository.add(draft);
      await queryClient.invalidateQueries({ queryKey: ['memories'] });
      onSaved(draft.visitedAt || visitedAt.trim());
    } catch {
      setError('Anın kaydedilemedi. Lütfen tekrar dene.');
      saving.current = false;
      setBusy(false);
    }
  }
  async function remove() {
    if (saving.current || !memory) return;
    saving.current = true;
    setBusy(true);
    try {
      await memoryRepository.delete(memory.id);
      await queryClient.invalidateQueries({ queryKey: ['memories'] });
      onDeleted?.();
    } catch {
      setError('Anın silinemedi. Lütfen tekrar dene.');
      saving.current = false;
      setBusy(false);
    }
  }
  return (
    <AppModal
      title={memory ? 'Anını düzenle' : 'Bir anı bırak'}
      busy={busy}
      onClose={onClose}
      footer={
        <View className="flex-row items-center gap-4">
          <Pressable accessibilityRole="button" disabled={busy} onPress={onClose} className="p-2">
            <Text className="font-manrope text-[12px] leading-5 text-[#203E35]">Vazgeç</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void save()}
            className={`min-h-11 flex-1 items-center justify-center rounded-xl bg-[#203E35] px-4 ${busy ? 'opacity-60' : ''}`}
          >
            <Text className="font-manrope-semibold text-[11px] text-white">
              {busy ? 'İşleniyor…' : memory ? 'Değişiklikleri kaydet' : 'Kaydet'}
            </Text>
          </Pressable>
        </View>
      }
    >
      <Text className="mb-4 font-manrope text-[12px] leading-5 text-[#203E35]">
        Küçük bir detay, unutulmaz bir yolculuk.
      </Text>
      <Text className="mb-2 font-manrope-semibold text-[10px] text-[#203E35]">YOLCULUK</Text>
      {fixedTrip ? (
        <View className="mb-4 rounded-xl bg-[#E9EEE4] px-3 py-3">
          <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
            {fixedTrip.destination} tatili
          </Text>
        </View>
      ) : (
        <View className="mb-4 flex-row flex-wrap gap-2">
          {[{ id: null, destination: 'Bağımsız anı' }, ...trips].map((trip) => (
            <Pressable
              key={trip.id ?? 'none'}
              accessibilityRole="button"
              accessibilityState={{ selected: tripId === trip.id }}
              onPress={() => setTripId(trip.id)}
              className={`rounded-full px-3 py-2 ${tripId === trip.id ? 'bg-[#203E35]' : 'bg-[#ECEDE5]'}`}
            >
              <Text
                className={`font-manrope text-[10px] ${tripId === trip.id ? 'text-white' : 'text-[#203E35]'}`}
              >
                {trip.destination}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      <TextInput
        accessibilityLabel="Mekân adı"
        editable={!busy}
        maxLength={200}
        value={placeName}
        onFocus={() => setPlaceSearchOpen(true)}
        onChangeText={(value) => {
          setPlaceName(value);
          setPlaceSearchOpen(true);
        }}
        placeholder="Mekân veya restoran ara (isteğe bağlı)"
        className="rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[12px] text-[#203E35]"
      />
      {placeSearchOpen && (
        <View className="mb-3 mt-2 overflow-hidden rounded-xl border border-[#E7E8DF] bg-white">
          {plannedPlaces.length > 0 && (
            <Text className="px-3 pt-3 font-manrope-semibold text-[9px] text-[#778078]">
              GEZİ PLANINDAKİ YERLER
            </Text>
          )}
          {plannedPlaces.map((stop) => (
            <Pressable
              key={stop.placeId}
              accessibilityRole="button"
              accessibilityLabel={`${stop.title} mekânını seç`}
              onPress={() => {
                setPlaceName(stop.title);
                setPlaceSearchOpen(false);
              }}
              className="border-b border-[#F0F1EA] px-3 py-3"
            >
              <Text className="font-manrope-semibold text-[11px] text-[#203E35]">{stop.title}</Text>
              <Text numberOfLines={1} className="font-manrope text-[9px] text-[#778078]">
                {stop.address}
              </Text>
            </Pressable>
          ))}
          {onlinePlaces.map((place) => (
            <Pressable
              key={place.id}
              accessibilityRole="button"
              accessibilityLabel={`${place.title} mekânını seç`}
              onPress={() => {
                setPlaceName(place.title);
                setPlaceSearchOpen(false);
              }}
              className="border-b border-[#F0F1EA] px-3 py-3"
            >
              <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
                {place.title}
              </Text>
              <Text numberOfLines={1} className="font-manrope text-[9px] text-[#778078]">
                {place.address}
              </Text>
            </Pressable>
          ))}
          {(placeSearchPending || placeSearch.isFetching) && (
            <Text className="px-3 py-3 font-manrope text-[10px] text-[#778078]">
              Mekânlar aranıyor…
            </Text>
          )}
          {placeSearch.isError && (
            <Text className="px-3 py-3 font-manrope text-[10px] text-[#A54839]">
              Canlı arama şu an kullanılamıyor. Mekân adını elle yazabilirsin.
            </Text>
          )}
          {!placeSearchPending &&
            !placeSearch.isFetching &&
            !placeSearch.isError &&
            placeSearchTerm.length >= 2 &&
            plannedPlaces.length === 0 &&
            onlinePlaces.length === 0 && (
              <Text className="px-3 py-3 font-manrope text-[10px] text-[#778078]">
                Sonuç bulunamadı. Mekân adını elle yazabilirsin.
              </Text>
            )}
        </View>
      )}
      <TextInput
        accessibilityLabel="Anı tarihi"
        editable={!busy}
        maxLength={10}
        value={visitedAt}
        onChangeText={setVisitedAt}
        placeholder="YYYY-AA-GG"
        keyboardType="numbers-and-punctuation"
        className="mb-3 rounded-xl border border-[#E7E8DF] bg-white p-3 font-manrope text-[12px] text-[#203E35]"
      />
      <TextInput
        accessibilityLabel="Seyahat anın"
        editable={!busy}
        multiline
        maxLength={5000}
        value={note}
        onChangeText={setNote}
        placeholder="Aklında kalan o an…"
        textAlignVertical="top"
        className="min-h-[130px] max-h-[220px] rounded-xl border border-[#E7E8DF] bg-white p-4 font-manrope text-[13px] text-[#203E35]"
      />
      {photoDataUrl && (
        <Image
          source={{ uri: photoDataUrl }}
          className="mt-3 h-[140px] w-full rounded-xl"
          resizeMode="cover"
        />
      )}
      <View className="mt-3 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void pickPhoto()}
          className="rounded-xl bg-[#E8E9DF] px-4 py-3"
        >
          <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
            {photoDataUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
          </Text>
        </Pressable>
        {photoDataUrl && (
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setPhotoDataUrl(null)}
            className="rounded-xl px-3 py-3"
          >
            <Text className="font-manrope text-[11px] text-[#A54839]">Kaldır</Text>
          </Pressable>
        )}
      </View>
      {!!error && (
        <Text
          accessibilityRole="alert"
          className="mt-2 font-manrope text-[12px] leading-5 text-[#A54839]"
        >
          {error}
        </Text>
      )}
      {memory && (
        <>
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => setConfirmDelete((value) => !value)}
            className="mt-3 min-h-10 items-center justify-center"
          >
            <Text className="font-manrope-semibold text-[11px] text-[#A54839]">
              {confirmDelete ? 'Silmeyi iptal et' : 'Bu anıyı sil'}
            </Text>
          </Pressable>
          {confirmDelete && (
            <View className="rounded-xl bg-[#F9E9E4] p-3">
              <Text className="mb-3 font-manrope text-[11px] leading-[17px] text-[#744336]">
                Bu anı hesabından kalıcı olarak silinecek.
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => void remove()}
                className="min-h-[42px] items-center justify-center rounded-lg bg-[#A54839]"
              >
                <Text className="font-manrope-semibold text-[11px] text-white">
                  Evet, anıyı sil
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </AppModal>
  );
}
