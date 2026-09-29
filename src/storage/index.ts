import AsyncStorage from '@react-native-async-storage/async-storage';
import { createScopedStore } from './scopedStore';
import { storageKeys } from './keys';

export const storage = createScopedStore(AsyncStorage);
export { storageKeys };

export async function exportLocalData() {
  const entries = await Promise.all(
    Object.values(storageKeys).map(
      async (key) => [key, await storage.get<unknown>(key, null, (value) => value)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
