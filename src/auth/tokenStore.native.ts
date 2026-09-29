import * as SecureStore from 'expo-secure-store';

const key = 'wanderly.backend.session.v1';
export const tokenStore = {
  get: () => SecureStore.getItemAsync(key),
  set: (value: string) => SecureStore.setItemAsync(key, value),
  clear: () => SecureStore.deleteItemAsync(key),
};
