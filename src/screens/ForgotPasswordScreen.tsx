import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import { Field } from '../components/Field';
import { colors } from '../theme/colors';

type Props = {
  email: string;
  busy: boolean;
  error: string;
  message: string;
  onEmailChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
};

export function ForgotPasswordScreen({
  email,
  busy,
  error,
  message,
  onEmailChange,
  onSubmit,
  onBack,
}: Props) {
  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerClassName="grow px-8 py-6"
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Giriş ekranına dön"
            disabled={busy}
            onPress={onBack}
            className="self-start min-h-[44px] flex-row items-center gap-2"
          >
            <Feather name="arrow-left" size={18} color={colors.ink} />
            <Text className="font-manrope text-[12px] text-ink">Geri</Text>
          </Pressable>

          <View className="flex-1 justify-center py-8">
            <View className="items-center mb-[29px]">
              <View className="w-[39px] h-[39px] rounded-full bg-[#FFFDFA] border border-[#EAE7E0] items-center justify-center">
                <Feather name="map-pin" size={19} color={colors.ink} />
              </View>
              <Text className="font-manrope text-[10px] text-[#809091] tracking-[3px] mt-4">
                WANDERLY
              </Text>
            </View>

            <Text
              accessibilityRole="header"
              className="font-garamond text-[36px] text-ink text-center"
            >
              {message ? 'Terminali kontrol et' : 'Şifreni mi unuttun?'}
            </Text>
            <Text className="font-manrope text-[12px] leading-5 text-muted text-center mt-2">
              {message
                ? 'Yolculuğuna kaldığın yerden devam et.'
                : 'Hesabının e-posta adresini yaz. Demo modunda e-posta gönderilmez; şifre yenileme bağlantısı bilgisayarındaki backend terminalinde görünür.'}
            </Text>

            <View className="mt-[34px]">
              <Field
                label="E-POSTA"
                value={email}
                onChange={onEmailChange}
                editable={!busy}
                placeholder="deniz@ornek.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={() => {
                  if (!busy) onSubmit();
                }}
              />
              {!!message && (
                <View className="rounded-xl bg-[#EDF2EA] border border-[#DFE7DB] p-4 mb-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Feather name="mail" size={18} color={colors.green} />
                    <Text className="font-manrope-semibold text-[12px] text-ink">
                      Demo bağlantısı
                    </Text>
                  </View>
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-manrope text-[12px] leading-5 text-ink"
                  >
                    {message}
                  </Text>
                </View>
              )}
              {!!error && (
                <Text
                  accessibilityRole="alert"
                  accessibilityLiveRegion="polite"
                  className="font-manrope text-[12px] leading-5 text-[#A54839] mb-4"
                >
                  {error}
                </Text>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ busy, disabled: busy }}
                disabled={busy}
                onPress={onSubmit}
                className={`bg-brandGreen rounded-[11px] min-h-[49px] px-4 flex-row items-center justify-center gap-[10px] active:opacity-75 ${busy ? 'opacity-70' : ''}`}
              >
                <Text className="font-manrope-semibold text-[13px] text-white">
                  {busy
                    ? 'Hazırlanıyor…'
                    : message
                      ? 'Bağlantıyı tekrar iste'
                      : 'Sıfırlama bağlantısı iste'}
                </Text>
                {busy ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Feather name="arrow-right" size={17} color="white" />
                )}
              </Pressable>
              <Text className="font-manrope text-[11px] leading-5 text-muted text-center mt-4">
                Terminaldeki bağlantıyı bilgisayarda açıp yeni şifreni belirle. Ardından uygulamaya
                dönüp giriş yap.
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={busy}
            onPress={onBack}
            className="min-h-[44px] items-center justify-center"
          >
            <Text className="font-manrope-semibold text-[12px] text-ink underline">
              Giriş yapmaya dön
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
