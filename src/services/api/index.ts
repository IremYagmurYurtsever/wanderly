import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { createApiClient, resolveApiUrl } from './client';

export const api = createApiClient(() =>
  resolveApiUrl(
    process.env.EXPO_PUBLIC_API_URL,
    Platform.OS === 'web' && typeof window !== 'undefined'
      ? window.location.host
      : Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost,
    __DEV__,
  ),
);
