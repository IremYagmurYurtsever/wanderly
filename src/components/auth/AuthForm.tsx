import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { Field } from '../Field';
import type { AuthFormLayoutProps } from './AuthForm.types';
import { colors } from '../../theme/colors';

export function AuthForm({
  screen,
  email,
  password,
  error,
  setEmail,
  setPassword,
  busy,
  message,
  onForgot,
  go,
  submit,
  beforeFields,
  afterFields,
}: AuthFormLayoutProps) {
  const signup = screen === 'signup';
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="grow px-8 pb-6 pt-9"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 justify-center pt-[10px] pb-[42px]">
          <Pressable
            disabled={busy}
            onPress={() => go('welcome')}
            accessibilityRole="button"
            accessibilityLabel="Başlangıç ekranına dön"
            className="items-center self-center mb-[29px]"
          >
            <View className="w-[39px] h-[39px] rounded-full bg-[#FFFDFA] border border-[#EAE7E0] items-center justify-center">
              <Feather name="map-pin" size={19} color={colors.ink} />
            </View>
            <Text className="font-manrope text-[10px] text-[#809091] tracking-[3px] mt-4">
              WANDERLY
            </Text>
          </Pressable>

          <Text className="font-garamond text-[36px] text-ink text-center">
            {signup ? 'Hesap oluştur' : 'Tekrar hoş geldin'}
          </Text>
          <Text className="font-manrope text-[12px] text-muted text-center mt-[5px]">
            {signup
              ? 'Seyahatlerini, anılarını ve rotalarını bir araya getir.'
              : 'Yeni yolculuğun seni bekliyor.'}
          </Text>

          <View className="mt-[34px]" pointerEvents={busy ? 'none' : 'auto'}>
            {beforeFields}
            <Field
              editable={!busy}
              label="E-POSTA"
              value={email}
              onChange={setEmail}
              placeholder="deniz@ornek.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
            />
            <Field
              key={screen}
              editable={!busy}
              label="ŞİFRE"
              value={password}
              onChange={setPassword}
              password
              placeholder={signup ? 'En az 8 karakter' : 'Şifrenizi girin'}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete={signup ? 'new-password' : 'current-password'}
              textContentType={signup ? 'newPassword' : 'password'}
              returnKeyType="done"
              onSubmitEditing={submit}
              onForgot={signup ? undefined : onForgot}
            />

            {afterFields}

            {!!message && (
              <Text
                accessibilityLiveRegion="polite"
                className="font-manrope text-[12px] leading-5 text-brandGreen mb-4"
              >
                {message}
              </Text>
            )}
            {!!error && (
              <Text
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                className="font-manrope color-[#A54839] text-[11px] mb-[12px] leading-[17px]"
              >
                {error}
              </Text>
            )}

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ busy, disabled: busy }}
              onPress={submit}
              className="bg-brandGreen rounded-[11px] min-h-[49px] px-[20px] flex-row items-center justify-center gap-[10px] mt-[5px] active:opacity-75"
            >
              <Text className="font-manrope-semibold text-[13px] text-white">
                {busy ? 'İşleniyor…' : signup ? 'Hesap Oluştur' : 'Giriş Yap'}
              </Text>
              <Feather name="arrow-right" size={17} color="white" />
            </Pressable>
          </View>
        </View>

        <View className="flex-row items-center justify-center flex-wrap gap-1 py-[10px]">
          <Text className="font-manrope text-[11px] text-muted">
            {signup ? 'Zaten hesabın var mı?' : 'Hesabın yok mu?'}
          </Text>
          <Pressable
            accessibilityRole="button"
            hitSlop={12}
            disabled={busy}
            onPress={() => go(signup ? 'signin' : 'signup')}
          >
            <Text className="font-manrope-semibold text-[11px] text-ink underline">
              {signup ? 'Giriş Yap' : 'Kayıt Ol'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
