export type StorageDriver = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
};

export function createJsonStore(driver: StorageDriver) {
  const pending = new Map<string, Promise<unknown>>();

  function enqueue<Result>(key: string, operation: () => Promise<Result>): Promise<Result> {
    const next = (pending.get(key) ?? Promise.resolve()).catch(() => undefined).then(operation);
    pending.set(key, next);
    void next
      .finally(() => {
        if (pending.get(key) === next) pending.delete(key);
      })
      .catch(() => undefined);
    return next;
  }

  async function read<Value>(key: string, fallback: Value, decode: (value: unknown) => Value) {
    const raw = await driver.getItem(key);
    return raw === null ? fallback : decode(JSON.parse(raw));
  }

  return {
    get<Value>(key: string, fallback: Value, decode: (value: unknown) => Value) {
      return enqueue(key, () => read(key, fallback, decode));
    },
    set<Value>(key: string, value: Value) {
      return enqueue(key, async () => {
        await driver.setItem(key, JSON.stringify(value));
        return value;
      });
    },
    update<Value>(
      key: string,
      fallback: Value,
      decode: (value: unknown) => Value,
      change: (current: Value) => Value,
    ) {
      return enqueue(key, async () => {
        const current = await read(key, fallback, decode);
        const next = change(current);
        await driver.setItem(key, JSON.stringify(next));
        return next;
      });
    },
  };
}
