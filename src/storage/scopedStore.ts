import { createJsonStore, type StorageDriver } from './jsonStore';

export function accountStorageKey(userId: string | null, key: string) {
  if (!userId) throw new Error('Authenticated storage requires a user.');
  return 'wanderly.user.' + encodeURIComponent(userId) + ':' + key;
}

export function createScopedStore(driver: StorageDriver) {
  const store = createJsonStore(driver);
  let userId: string | null = null;
  return {
    setUser: (next: string | null) => {
      userId = next;
    },
    get<Value>(key: string, fallback: Value, decode: (value: unknown) => Value) {
      return store.get(accountStorageKey(userId, key), fallback, decode);
    },
    set<Value>(key: string, value: Value) {
      return store.set(accountStorageKey(userId, key), value);
    },
    update<Value>(
      key: string,
      fallback: Value,
      decode: (value: unknown) => Value,
      change: (current: Value) => Value,
    ) {
      return store.update(accountStorageKey(userId, key), fallback, decode, change);
    },
  };
}
