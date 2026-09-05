/** Public-source fetches are bounded so an upstream outage never leaves the page hanging. */
export async function fetchJson(
  url: string,
  init: RequestInit = {},
): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  const response = await fetch(url, {
    ...init,
    cache: 'no-store',
    headers,
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  const text = await response.text();
  if (text.length > 12_000_000)
    throw new Error('Source response exceeded the allowed size');
  return JSON.parse(text) as unknown;
}

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid source object');
  return value as Record<string, unknown>;
}

/** A missing/empty field is unknown, never silently converted to zero. */
export function finite(value: unknown): number {
  if (
    (typeof value !== 'number' && typeof value !== 'string') ||
    value === '' ||
    (typeof value === 'string' && !value.trim())
  )
    throw new Error('Missing numeric source field');
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error('Invalid numeric source field');
  return number;
}
