import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, BackHandler, Pressable, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { CormorantGaramond_400Regular } from '@expo-google-fonts/cormorant-garamond/400Regular';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { SignInScreen } from './screens/SignInScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { NoticeModal } from './components/NoticeModal';
import { SignedInApp } from './navigation/SignedInApp';
import { QueryProvider } from './query/QueryProvider';
import { useAuthentication } from './auth/useAuthentication';
import type { Screen, Notice } from './types';
import { previousScreen } from './navigation/routes';

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_400Regular,
    Manrope_400Regular,
    Manrope_600SemiBold,
  });
  const auth = useAuthentication();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const fade = useRef(new Animated.Value(0)).current;

  function go(next: Screen) {
    if (auth.busy) return;
    auth.clearFeedback();
    setPassword('');
    setScreen(
      next === 'welcome' || next === 'signup' || next === 'forgot-password' ? next : 'signin',
    );
  }

  useEffect(() => {
    setPassword('');
    setAgreed(false);
    setName('');
    setEmail('');
    setNotice(null);
    if (auth.ready) setScreen('signin');
  }, [auth.session?.uid]);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (auth.session) return false;
      if (auth.busy) return true;
      const previous = previousScreen(screen);
      if (!previous) return false;
      go(previous);
      return true;
    });
    return () => handler.remove();
  }, [screen, fade, auth.session, auth.busy]);

  async function submit() {
    const success = await auth.submit(email, password, screen === 'signup', name, agreed);
    if (success) setPassword('');
  }

  const formProps = {
    name,
    email,
    password,
    agreed,
    error: auth.error,
    message: auth.message,
    busy: auth.busy,
    setName,
    setEmail,
    setPassword,
    setAgreed,
    setNotice,
    go,
    submit: () => void submit(),
    onForgot: () => go('forgot-password'),
  };

  return (
    <SafeAreaProvider>
      <View className="flex-1 bg-[#F8F6F0]">
        <StatusBar style="dark" />
        {(!fontsLoaded && !fontError) || !auth.ready ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#617F6D" accessibilityLabel="Oturum yükleniyor" />
          </View>
        ) : auth.restoreFailed ? (
          <View className="flex-1 justify-center px-8 max-w-[480px] w-full self-center">
            <Text className="font-garamond text-[32px] text-ink text-center">
              Oturum kontrol edilemedi
            </Text>
            <Text
              accessibilityRole="alert"
              className="font-manrope text-[13px] text-muted text-center my-6"
            >
              {auth.error}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={auth.busy}
              onPress={() => void auth.retryRestore()}
              className="bg-brandGreen rounded-xl min-h-[49px] items-center justify-center"
            >
              <Text className="font-manrope-semibold text-white">Yeniden dene</Text>
            </Pressable>
          </View>
        ) : auth.session ? (
          <QueryProvider key={auth.session.uid}>
            <SignedInApp session={auth.session} onLogout={auth.logout} busy={auth.busy} />
          </QueryProvider>
        ) : (
          <Animated.View
            style={{ opacity: fade, flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' }}
          >
            {screen === 'welcome' ? (
              <WelcomeScreen go={go} />
            ) : screen === 'signup' ? (
              <SignUpScreen {...formProps} />
            ) : screen === 'forgot-password' ? (
              <ForgotPasswordScreen
                email={email}
                busy={auth.busy}
                error={auth.error}
                message={auth.message}
                onEmailChange={(value) => {
                  auth.clearFeedback();
                  setEmail(value);
                }}
                onSubmit={() => void auth.resetPassword(email)}
                onBack={() => go('signin')}
              />
            ) : (
              <SignInScreen {...formProps} />
            )}
          </Animated.View>
        )}
        <NoticeModal notice={notice} onClose={() => setNotice(null)} />
      </View>
    </SafeAreaProvider>
  );
}
