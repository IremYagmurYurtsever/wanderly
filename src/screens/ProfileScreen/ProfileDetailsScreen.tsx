import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Feather from '@expo/vector-icons/Feather';
import type { Profile } from '../../models/profile';
import { profileInitials } from '../../models/profile';
import { palette, styles } from './ProfileScreen.styles';

type Props = {
  profile: Profile;
  busy: boolean;
  onClose: () => void;
  onSave: (patch: Partial<Profile>) => Promise<boolean>;
  onChangeEmail: (email: string, password: string) => Promise<string | null>;
};

export function ProfileDetailsScreen({ profile, busy, onClose, onSave, onChangeEmail }: Props) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [avatarDataUrl, setAvatarDataUrl] = useState(profile.avatarDataUrl);
  const [email, setEmail] = useState(profile.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function pickAvatar() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        base64: true,
        quality: 0.3,
      });
      if (result.canceled) return;
      const base64 = result.assets[0]?.base64;
      if (!base64) throw new Error('Fotoğraf okunamadı.');
      const dataUrl = `data:image/jpeg;base64,${base64}`;
      if (dataUrl.length > 1_500_000)
        throw new Error('Fotoğraf çok büyük. Daha küçük bir fotoğraf seç.');
      setAvatarDataUrl(dataUrl);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Fotoğraf seçilemedi.');
    }
  }

  async function save() {
    if (busy) return;
    if (name.trim().length < 2) return setError('Ad soyad en az 2 karakter olmalı.');
    if (phone.trim() && !/^\+?[1-9]\d{9,14}$/.test(phone.replace(/[\s()-]/g, '')))
      return setError('Telefon numarasını ülke koduyla gir.');
    setError('');
    if (
      await onSave({
        name: name.trim(),
        bio: bio.trim(),
        phone: phone.trim() || null,
        avatarDataUrl,
      })
    )
      onClose();
    else setError('Profil bilgileri kaydedilemedi.');
  }

  async function saveEmail() {
    if (busy) return;
    if (email.trim().toLowerCase() === profile.email.toLowerCase())
      return setError('Yeni e-posta adresi eskisinden farklı olmalı.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError('Geçerli bir e-posta adresi gir.');
    if (!password) return setError('E-postayı değiştirmek için mevcut şifreni gir.');
    setError('');
    const failure = await onChangeEmail(email.trim().toLowerCase(), password);
    setPassword('');
    if (failure) setError(failure);
    else setMessage('E-posta adresin güncellendi. Sonraki girişte yeni adresini kullan.');
  }

  return (
    <SafeAreaView edges={['top']} className={styles.page}>
      <View className="flex-row items-center border-b border-[#E7E8DF] px-5 py-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Profile dön"
          onPress={onClose}
          className="h-11 w-11 justify-center"
        >
          <Feather name="arrow-left" size={20} color={palette.ink} />
        </Pressable>
        <Text accessibilityRole="header" className="font-garamond text-[27px] text-[#203E35]">
          Profil bilgileri
        </Text>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerClassName="px-5 pb-10"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        >
          <Text className="mb-4 mt-6 font-manrope text-[11px] leading-5 text-[#77856D]">
            Sana ait bilgiler. Fotoğraf seçmezsen ad ve soyadının baş harfleri görünür.
          </Text>
          <View className="mb-6 items-center gap-3 rounded-2xl bg-[#EFF1E8] p-5">
            <View className="h-[88px] w-[88px] items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#D6DEC6]">
              {avatarDataUrl ? (
                <Image
                  source={{ uri: avatarDataUrl }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <Text className="font-garamond text-[36px] text-[#49644F]">
                  {profileInitials(name)}
                </Text>
              )}
            </View>
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void pickAvatar()}
              className="rounded-full bg-[#203E35] px-4 py-2"
            >
              <Text className="font-manrope-semibold text-[11px] text-white">
                {avatarDataUrl ? 'Fotoğrafı değiştir' : 'Fotoğraf ekle'}
              </Text>
            </Pressable>
            {avatarDataUrl && (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={() => setAvatarDataUrl(null)}
              >
                <Text className="font-manrope text-[10px] text-[#A54839]">Fotoğrafı kaldır</Text>
              </Pressable>
            )}
          </View>
          <Text className={styles.label}>AD SOYAD</Text>
          <TextInput
            accessibilityLabel="Ad soyad"
            value={name}
            onChangeText={setName}
            maxLength={100}
            autoCapitalize="words"
            className={styles.input}
          />
          <Text className={styles.label}>TELEFON NUMARASI</Text>
          <TextInput
            accessibilityLabel="Telefon numarası"
            value={phone}
            onChangeText={setPhone}
            maxLength={22}
            keyboardType="phone-pad"
            placeholder="+90 5xx xxx xx xx · isteğe bağlı"
            className={styles.input}
          />
          <Text className={styles.label}>KENDİNDEN BAHSET</Text>
          <TextInput
            accessibilityLabel="Hakkımda"
            value={bio}
            onChangeText={setBio}
            maxLength={220}
            multiline
            textAlignVertical="top"
            placeholder="Kısaca kendini anlat"
            className={[styles.input, '!min-h-[100px]'].join(' ')}
          />
          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={() => void save()}
            className={`${styles.button} mt-1`}
          >
            <Text className={styles.buttonText}>{busy ? 'Kaydediliyor…' : 'Bilgileri kaydet'}</Text>
          </Pressable>
          <View className="mt-8 border-t border-[#E7E8DF] pt-6">
            <Text className="font-garamond text-[25px] text-[#203E35]">E-posta adresi</Text>
            <Text className="mb-4 mt-1 font-manrope text-[10px] leading-4 text-[#8B9389]">
              E-postanı değiştirmek için mevcut şifren gerekir. Doğrulama e-postası bu sunum
              sürümünde gönderilmez.
            </Text>
            <TextInput
              accessibilityLabel="Yeni e-posta"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className={styles.input}
            />
            <TextInput
              accessibilityLabel="Mevcut şifre"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Mevcut şifren"
              className={styles.input}
            />
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => void saveEmail()}
              className={`${styles.button} mt-1`}
            >
              <Text className={styles.buttonText}>E-postayı değiştir</Text>
            </Pressable>
          </View>
          {!!error && (
            <Text
              accessibilityRole="alert"
              className="mt-4 font-manrope text-[11px] text-[#A54839]"
            >
              {error}
            </Text>
          )}
          {!!message && (
            <Text
              accessibilityRole="alert"
              className="mt-4 font-manrope text-[11px] text-[#49644F]"
            >
              {message}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
