export type Feed<T> = {
  status: 'live' | 'stale' | 'unavailable';
  data: T | null;
  fetchedAt: string | null;
  checkedAt: string;
  error: string | null;
};

type Entry<T> = { data: T; fetchedAt: string };
type Store = {
  get: (key: string) => Promise<unknown>;
  put: (key: string, value: unknown) => Promise<void>;
};

/** Keeps the original observation time when a fetch fails. Never promotes stale data to live. */
export function createLiveCache(
  store: Store,
  options: { ttlMs: number; maxStaleMs: number; now?: () => number },
) {
  const pending = new Map<string, Promise<Feed<unknown>>>();
  const now = options.now ?? Date.now;
  return async function read<T>(
    key: string,
    loader: () => Promise<T>,
  ): Promise<Feed<T>> {
    const checkedAt = new Date(now()).toISOString();
    const cached = (await store.get(key).catch(() => null)) as Entry<T> | null;
    const age = cached ? now() - Date.parse(cached.fetchedAt) : Infinity;
    if (cached && Number.isFinite(age) && age >= 0 && age < options.ttlMs) {
      return { status: 'live', ...cached, checkedAt, error: null };
    }
    const existing = pending.get(key);
    if (existing) return existing as Promise<Feed<T>>;
    const work = (async (): Promise<Feed<T>> => {
      try {
        const data = await loader();
        const entry = { data, fetchedAt: new Date(now()).toISOString() };
        await store.put(key, entry).catch(() => undefined);
        return { status: 'live', ...entry, checkedAt, error: null };
      } catch {
        const usable =
          cached &&
          Number.isFinite(age) &&
          age >= 0 &&
          age <= options.maxStaleMs;
        return {
          status: usable ? 'stale' : 'unavailable',
          data: usable ? cached.data : null,
          fetchedAt: usable ? cached.fetchedAt : null,
          checkedAt,
          error: 'The source could not be refreshed. Try again shortly.',
        };
      } finally {
        pending.delete(key);
      }
    })();
    pending.set(key, work);
    return work;
  };
}

const memory = new Map<string, unknown>();
export const memoryStore: Store = {
  async get(key) {
    return memory.get(key) ?? null;
  },
  async put(key, value) {
    memory.set(key, value);
  },
};
