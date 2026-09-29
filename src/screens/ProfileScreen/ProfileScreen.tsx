import { ScreenHeader } from '../../components/ScreenHeader';
import { createTabHandler } from '../../navigation/routes';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportAccountData, memoryRepository, selectionRepository } from '../../repositories';
import { storageKeys } from '../../storage';
import { homeQuery } from '../../query/trips';
import { countriesQuery } from '../../query/places';
import { profileInitials } from '../../models/profile';
import { type Visa, type VisaDraft } from '../../models/visa';
import { visaRepository } from '../../repositories/visas';
import { StatCard } from '../../components/StatCard';
import type { Profile } from '../../models/profile';
import Feather from '@expo/vector-icons/Feather';
import { HomeBottomBar } from '../../components/HomeBottomBar';
import type { Notice, Screen } from '../../types';
import { ProfileEditor, type EditorMode } from './components/ProfileEditor';
import { ProfileDetailsScreen } from './ProfileDetailsScreen';
import { VisaEditor } from './components/VisaEditor';
import { VisaCard } from './components/VisaCard';
import { useProfile } from './useProfile';
import { palette, styles } from './ProfileScreen.styles';

type ProfileScreenProps = {
  name: string;
  go: (screen: Screen) => void;
  setNotice: (notice: Notice) => void;
  onNameChange: (name: string) => void;
  onLogout: () => void;
  signingOut: boolean;
  onOpenJournal: (tripId: string) => void;
};
type Setting = {
  title: string;
  detail: string;
  icon: ComponentProps<typeof Feather>['name'];
  onPress: () => void;
};

export function ProfileScreen({
  name,
  go,
  setNotice,
  onNameChange,
  onLogout,
  signingOut,
  onOpenJournal,
}: ProfileScreenProps) {
  const { profile, ready, busy, error, update, changeEmail } = useProfile(name);
  const [editor, setEditor] = useState<EditorMode | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [visaEditor, setVisaEditor] = useState<{ visa?: Visa } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [exporting, setExporting] = useState(false);
  const home = useQuery(homeQuery);
  const memories = useQuery({ queryKey: ['memories'], queryFn: memoryRepository.load });
  const savedPlaces = useQuery({
    queryKey: ['selection', storageKeys.savedPlaces],
    queryFn: () => selectionRepository.load(storageKeys.savedPlaces),
  });
  const visas = useQuery({ queryKey: ['visas'], queryFn: visaRepository.load });
  const countries = useQuery(countriesQuery);
  const queryClient = useQueryClient();
  const counts =
    home.data && memories.data && savedPlaces.data
      ? {
          trips: home.data.trips.length,
          memories: memories.data.length,
          places: savedPlaces.data.length,
        }
      : null;
  const scroll = useRef<ScrollView>(null);
  const settingsOffset = useRef(0);
  const initials = profileInitials(profile.name);

  useEffect(() => {
    if (!detailsOpen) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setDetailsOpen(false);
      return true;
    });
    return () => subscription.remove();
  }, [detailsOpen]);

  const select = createTabHandler('Profil', go, () =>
    scroll.current?.scrollTo({ y: 0, animated: true }),
  );

  async function saveProfile(patch: Partial<Profile>) {
    const success = await update(patch);
    if (success && patch.name) onNameChange(patch.name);
    return success;
  }

  async function saveVisa(draft: VisaDraft) {
    if (visaEditor?.visa) await visaRepository.update(visaEditor.visa.id, draft);
    else await visaRepository.add(draft);
    await queryClient.invalidateQueries({ queryKey: ['visas'] });
    setVisaEditor(null);
  }

  async function deleteVisa() {
    if (!visaEditor?.visa) return;
    await visaRepository.delete(visaEditor.visa.id);
    await queryClient.invalidateQueries({ queryKey: ['visas'] });
    setVisaEditor(null);
  }

  async function shareProfile() {
    try {
      await Share.share({
        title: 'Wanderly gezgin profili',
        message: `${profile.name}\n${profile.bio}\n\nSeyahat tercihlerim: ${profile.preferences.join(', ') || 'Henüz seçilmedi'}`,
      });
    } catch {
      setNotice({
        title: 'Paylaşım açılamadı',
        body: 'Bu cihaz veya tarayıcı paylaşımı desteklemiyor olabilir.',
      });
    }
  }

  async function exportData() {
    if (exporting) return;
    setExporting(true);
    try {
      const data = await exportAccountData();
      await Share.share({
        title: 'Wanderly hesap yedeği',
        message: JSON.stringify(
          { application: 'Wanderly', exportedAt: new Date().toISOString(), data },
          null,
          2,
        ),
      });
    } catch {
      setNotice({
        title: 'Dışa aktarılamadı',
        body: 'Kayıtların okunamadı veya cihazın paylaşımı desteklemiyor. Yerel kayıtların değiştirilmedi.',
      });
    } finally {
      setExporting(false);
    }
  }

  const settings: Setting[] = [
    {
      title: 'Seyahat tercihleri',
      detail: profile.preferences.join(' · ') || 'İlgi alanlarını seç',
      icon: 'grid',
      onPress: () => setEditor('preferences'),
    },
    {
      title: 'Para birimi ve bütçe',
      detail: `${profile.currency} · Varsayılan bütçe para birimi`,
      icon: 'dollar-sign',
      onPress: () => setEditor('currency'),
    },
    {
      title: 'Günlüğü dışa aktar',
      detail: exporting ? 'Yedeğin hazırlanıyor…' : 'Hesap verilerini JSON olarak paylaş',
      icon: 'download',
      onPress: () => void exportData(),
    },
    {
      title: 'Gizlilik ve verilerim',
      detail: 'Sunucu ve cihaz kayıtların hakkında bilgi',
      icon: 'shield',
      onPress: () =>
        setNotice({
          title: 'Gizlilik ve verilerin',
          body: 'Kaydettiğin profil, geziler, anılar ve favoriler hesabına özel PostgreSQL kayıtlarıdır. Form taslakları cihazda tutulur. Eski yerel kayıtların silinmedi; hesap yedeğindeki legacyLocal alanında bulunur, sunucuya otomatik aktarılmaz. Paylaşım hedefini sen seçersin.',
        }),
    },
  ];
  const filtered = settings.filter((item) =>
    `${item.title} ${item.detail}`
      .toLocaleLowerCase('tr-TR')
      .includes(query.trim().toLocaleLowerCase('tr-TR')),
  );

  if (!ready)
    return (
      <View className={[styles.page, '!items-center !justify-center'].filter(Boolean).join(' ')}>
        <ActivityIndicator accessibilityLabel="Profil yükleniyor" color={palette.green} />
      </View>
    );

  if (detailsOpen)
    return (
      <ProfileDetailsScreen
        profile={profile}
        busy={busy}
        onClose={() => setDetailsOpen(false)}
        onSave={saveProfile}
        onChangeEmail={changeEmail}
      />
    );

  return (
    <SafeAreaView edges={['top']} className={styles.page}>
      <ScrollView
        ref={scroll}
        className="flex-1"
        automaticallyAdjustKeyboardInsets
        contentContainerClassName={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          name={profile.name}
          searchOpen={searchOpen}
          onSearch={() => {
            setSearchOpen(!searchOpen);
            setQuery('');
            scroll.current?.scrollTo({ y: settingsOffset.current, animated: true });
          }}
          onProfile={() => select('Profil')}
        />
        <View className={[styles.between, '!mt-[23px]'].filter(Boolean).join(' ')}>
          <View>
            <Text accessibilityRole="header" className={styles.title}>
              Gezgin Profili
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profil tercihlerini düzenle"
            onPress={() => setEditor('preferences')}
            className={styles.icon}
          >
            <Feather name="sliders" size={17} color={palette.ink} />
          </Pressable>
        </View>
        <View className={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              profile.avatarDataUrl ? 'Profil fotoğrafını büyüt' : 'Ad soyad baş harfleri'
            }
            disabled={!profile.avatarDataUrl}
            onPress={() => setPhotoOpen(true)}
            className={styles.portrait}
          >
            {profile.avatarDataUrl ? (
              <Image
                source={{ uri: profile.avatarDataUrl }}
                className="absolute h-full w-full rounded-full"
                resizeMode="cover"
              />
            ) : (
              <Text className={styles.initials}>{initials}</Text>
            )}
            <View className={styles.portraitBadge}>
              <Feather name="compass" size={13} color="white" />
            </View>
          </Pressable>
          <Text className={[styles.title, '!text-[30px] !text-center'].filter(Boolean).join(' ')}>
            {profile.name}
          </Text>
          <Text className={[styles.small, '!tracking-[0.6px] !mt-[4px]'].filter(Boolean).join(' ')}>
            MERAKLI GEZGİN
          </Text>
          <View className={styles.member}>
            <Feather name="sun" size={11} color={palette.green} />
            <Text
              className={[styles.small, '!text-[#49644F] !text-[8px]'].filter(Boolean).join(' ')}
            >
              Kendi rotanı çiz
            </Text>
          </View>
          <Text
            className={[styles.text, '!text-center !text-[#77856D] !text-[10px] !leading-[18px]']
              .filter(Boolean)
              .join(' ')}
          >
            {profile.bio || 'Hikâyeni birkaç cümleyle anlat.'}
          </Text>
          <View className={[styles.row, '!w-full !mt-[17px]'].filter(Boolean).join(' ')}>
            <Pressable
              accessibilityRole="button"
              onPress={() => setDetailsOpen(true)}
              className={[styles.button, '!flex-1'].filter(Boolean).join(' ')}
            >
              <Feather name="edit-3" size={12} color="white" />
              <Text className={styles.buttonText}>Profili düzenle</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Profilimi paylaş"
              onPress={() => void shareProfile()}
              className={styles.icon}
            >
              <Feather name="share-2" size={16} color={palette.green} />
            </Pressable>
          </View>
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            className={[styles.text, '!text-[#A54839] !mt-[12px]'].filter(Boolean).join(' ')}
          >
            {error}
          </Text>
        )}
        <View className={styles.section}>
          <View className={styles.between}>
            <Text className={styles.label}>HESAP ÖZETİN</Text>
            <Text className={[styles.small, '!text-[8px]'].filter(Boolean).join(' ')}>
              {counts ? 'Güncel kayıtların' : 'Kayıtlar yüklenemedi'}
            </Text>
          </View>
          <View className={[styles.row, '!mt-[12px]'].filter(Boolean).join(' ')}>
            {[
              { value: counts?.trips ?? '—', title: 'Gezi' },
              { value: counts?.memories ?? '—', title: 'Anı' },
              { value: counts?.places ?? '—', title: 'Kaydedilen' },
            ].map((item) => (
              <StatCard key={item.title} value={item.value} label={item.title} />
            ))}
          </View>
        </View>
        <View className={styles.section}>
          <View className={styles.between}>
            <View>
              <Text className={styles.label}>KAYDETTİĞİN ANILAR</Text>
              <Text className={[styles.title, '!mt-[4px] !text-[25px]'].filter(Boolean).join(' ')}>
                Tatil günlüklerin
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={() => go('journal')} className="p-2">
              <Text className="font-manrope-semibold text-[9px] text-[#49644F]">Tümü →</Text>
            </Pressable>
          </View>
          {(home.data?.trips ?? []).map((trip) => {
            const tripMemories = (memories.data ?? []).filter(
              (memory) => memory.tripId === trip.id,
            );
            const latest = tripMemories.at(-1);
            return (
              <Pressable
                key={trip.id}
                accessibilityRole="button"
                accessibilityLabel={`${trip.destination} tatili günlüğünü aç`}
                onPress={() => onOpenJournal(trip.id)}
                className="mt-3 flex-row items-center gap-3 rounded-2xl border border-[#ECEDE4] bg-[#FFFEFA] p-4"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-[#EAF0DF]">
                  <Feather name="book-open" size={17} color="#49644F" />
                </View>
                <View className="flex-1">
                  <Text className="font-garamond text-[20px] text-[#203E35]">
                    {trip.destination} tatili
                  </Text>
                  <Text className="font-manrope text-[9px] text-[#778078]">
                    {tripMemories.length} anı · {trip.dates}
                  </Text>
                  {latest && (
                    <Text numberOfLines={1} className="mt-1 font-manrope text-[9px] text-[#66756A]">
                      {latest.placeName ? `${latest.placeName} · ` : ''}
                      {latest.text}
                    </Text>
                  )}
                </View>
                <Feather name="chevron-right" size={16} color="#49644F" />
              </Pressable>
            );
          })}
          {home.data?.trips.length === 0 && (
            <Text className="mt-3 font-manrope text-[10px] text-[#778078]">
              Henüz tatil günlüğün yok. Bir gezi planladığında burada görünecek.
            </Text>
          )}
        </View>
        <View className={styles.section}>
          <View className={styles.between}>
            <View>
              <Text className={styles.label}>KİŞİSEL HATIRLATICILAR</Text>
              <Text className={[styles.title, '!text-[25px] !mt-[4px]'].filter(Boolean).join(' ')}>
                Vize defterim
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setVisaEditor({})}
              className={styles.button}
            >
              <Feather name="plus" size={13} color="white" />
              <Text className={styles.buttonText}>Ekle</Text>
            </Pressable>
          </View>
          <Text className={[styles.small, '!mt-[7px]'].filter(Boolean).join(' ')}>
            Başlangıç tarihi ve verilen süreye göre hesaplanır; resmi vize belgeni kontrol et.
          </Text>
          {visas.isError && (
            <Pressable
              accessibilityRole="button"
              onPress={() => void visas.refetch()}
              className="mt-3 rounded-xl bg-[#F9E9E4] p-3"
            >
              <Text className={styles.text}>Vize kayıtları yüklenemedi. Tekrar dene →</Text>
            </Pressable>
          )}
          {!visas.isError && visas.data?.length === 0 && (
            <View className="mt-3 rounded-2xl border border-[#ECEDE4] bg-[#FFFEFA] p-5">
              <Text className={styles.text}>
                Henüz vize kaydın yok. Ülke ve verilen süreyi ekleyebilirsin.
              </Text>
            </View>
          )}
          <View className="mt-3 gap-2">
            {(visas.data ?? []).map((visa) => {
              const country = countries.data?.find((item) => item.code === visa.countryCode);
              return (
                <VisaCard
                  key={visa.id}
                  visa={visa}
                  countryName={country?.label ?? visa.countryCode}
                  onOpen={() => setVisaEditor({ visa })}
                />
              );
            })}
          </View>
        </View>
        <View
          onLayout={(event) => {
            settingsOffset.current = event.nativeEvent.layout.y;
          }}
          className={styles.section}
        >
          <Text className={styles.label}>SANA ÖZEL AYARLAR</Text>
          {searchOpen && (
            <TextInput
              autoFocus
              accessibilityLabel="Profil ayarı araması"
              placeholder="Bir ayar ara…"
              value={query}
              onChangeText={setQuery}
              className={[styles.input, '!mt-[13px] !mb-0'].filter(Boolean).join(' ')}
            />
          )}
          <View className={styles.settings}>
            {filtered.map((item) => (
              <Pressable
                key={item.title}
                accessibilityRole="button"
                disabled={exporting && item.icon === 'download'}
                onPress={item.onPress}
                className={styles.setting}
              >
                <View className={styles.settingIcon}>
                  <Feather name={item.icon} size={16} color={palette.ink} />
                </View>
                <View className="flex-1">
                  <Text className={styles.text}>{item.title}</Text>
                  <Text
                    className={[styles.small, '!text-[8px] !mt-[2px]'].filter(Boolean).join(' ')}
                  >
                    {item.detail}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color={palette.muted} />
              </Pressable>
            ))}
            {filtered.length === 0 && (
              <Text className={[styles.small, '!p-[20px]'].filter(Boolean).join(' ')}>
                Bu aramaya uygun ayar bulunamadı.
              </Text>
            )}
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={signingOut}
          onPress={onLogout}
          className="mt-5 min-h-11 flex-row items-center justify-center gap-2 rounded-xl border border-[#C7D2C4] bg-[#F0F3EC] px-5"
        >
          <Feather name="log-out" size={15} color={palette.green} />
          <Text className="font-manrope-semibold text-[11px] text-[#203E35]">
            {signingOut ? 'Çıkış yapılıyor…' : 'Wanderly’den çıkış yap'}
          </Text>
        </Pressable>
        <Text className={[styles.small, '!text-center !text-[8px]'].filter(Boolean).join(' ')}>
          Wanderly v1.0.0 · Yavaş yolculuklar, kalıcı anılar
        </Text>
      </ScrollView>
      <HomeBottomBar activeTab="Profil" onSelect={select} />
      {editor && (
        <ProfileEditor
          mode={editor}
          profile={profile}
          busy={busy}
          onClose={() => setEditor(null)}
          onSave={saveProfile}
        />
      )}
      {visaEditor && (
        <VisaEditor
          visa={visaEditor.visa}
          countries={countries.data ?? []}
          onClose={() => setVisaEditor(null)}
          onSave={saveVisa}
          onDelete={visaEditor.visa ? deleteVisa : undefined}
        />
      )}
      <Modal
        visible={photoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPhotoOpen(false)}
      >
        <SafeAreaView className="flex-1 justify-center bg-[#11241FF2] p-5">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fotoğrafı kapat"
            onPress={() => setPhotoOpen(false)}
            className="mb-4 self-end p-3"
          >
            <Feather name="x" size={24} color="white" />
          </Pressable>
          {profile.avatarDataUrl && (
            <Image
              source={{ uri: profile.avatarDataUrl }}
              resizeMode="contain"
              className="h-[70%] w-full"
              accessibilityLabel="Profil fotoğrafı"
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
