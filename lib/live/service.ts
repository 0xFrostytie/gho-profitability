import { createLiveCache, memoryStore, type Feed } from './cache';
import { fetchFinancials, fetchQuarters } from './tokenlogic';
import { fetchMarkets } from './markets';
import type { LiveData, FinancialData } from './types';

const CACHE_VERSION = 'gho-live-v2';
const store =
  typeof caches === 'undefined'
    ? memoryStore
    : {
        async get(key: string) {
          const cache = await caches.open(CACHE_VERSION);
          const response = await cache.match(
            new Request(
              `https://gho-profitability.frostyxbt.chatgpt.site/__data-cache/${CACHE_VERSION}/${key}`,
            ),
          );
          return response ? response.json() : null;
        },
        async put(key: string, value: unknown) {
          const cache = await caches.open(CACHE_VERSION);
          await cache.put(
            new Request(
              `https://gho-profitability.frostyxbt.chatgpt.site/__data-cache/${CACHE_VERSION}/${key}`,
            ),
            new Response(JSON.stringify(value), {
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'public, max-age=86400',
              },
            }),
          );
        },
      };
const read = createLiveCache(store, { ttlMs: 60_000, maxStaleMs: 86_400_000 });

export function applyFinancialFreshness(
  feed: Feed<FinancialData>,
  now = Date.now(),
): Feed<FinancialData> {
  if (!feed.data) return feed;
  const age = now - Date.parse(feed.data.sourceUpdatedAt);
  if (age > 36 * 60 * 60 * 1000 || age < -5 * 60 * 1000)
    return {
      ...feed,
      status: 'stale',
      error:
        'The provider’s reporting timestamp is old or inconsistent. These are its last reported values.',
    };
  return feed;
}
export async function getLiveData(): Promise<LiveData> {
  const [financials, quarters, markets] = await Promise.all([
    read('financials', fetchFinancials),
    read('quarters', fetchQuarters),
    read('markets', fetchMarkets),
  ]);
  return {
    version: 1,
    requestedAt: new Date().toISOString(),
    refreshAfterSeconds: 120,
    financials: applyFinancialFreshness(financials),
    quarters,
    markets,
  };
}
