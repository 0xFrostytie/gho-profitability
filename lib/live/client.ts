import type { Feed } from './cache';
import type { LiveData } from './types';

/** An outage must not renew observation times or retain obsolete browser data forever. */
export function retainAfterFailure(
  data: LiveData | null,
  now = Date.now(),
): LiveData | null {
  if (!data) return null;
  function retain<T>(feed: Feed<T>): Feed<T> {
    const age = feed.fetchedAt ? now - Date.parse(feed.fetchedAt) : Infinity;
    if (feed.data && Number.isFinite(age) && age >= 0 && age <= 86_400_000)
      return {
        ...feed,
        status: 'stale',
        error: 'Refresh failed; these are the last available values.',
      };
    return {
      ...feed,
      status: 'unavailable',
      data: null,
      fetchedAt: null,
      error: 'No observation within the past 24 hours is available.',
    };
  }
  return {
    ...data,
    financials: retain(data.financials),
    quarters: retain(data.quarters),
    markets: retain(data.markets),
  };
}
