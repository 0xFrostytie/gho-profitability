import { getLiveData } from '@/lib/live/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const data = await getLiveData();
  return Response.json(data, {
    headers: {
      // The server manages per-source caching, including honest stale-on-error metadata.
      // Do not let browser or intermediary caching turn a refresh into a silent stale response.
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
