const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'https://amenguide-backend-775250805671.us-west1.run.app';
const SITE_URL = 'https://catholica.kr';

export async function GET() {
  let events: any[] = [];
  try {
    const res = await fetch(`${API_BASE}/events?page=1&pageSize=30`, { next: { revalidate: 3600 } });
    if (res.ok) {
      const data = await res.json();
      events = data.data ?? [];
    }
  } catch {}

  const escXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const items = events.map(e => `
    <item>
      <title>${escXml(e.title)}</title>
      <link>${SITE_URL}/events/${e.id}</link>
      <guid isPermaLink="true">${SITE_URL}/events/${e.id}</guid>
      <description>${escXml(e.aiSummary || '')}</description>
      <category>${escXml(e.category || '기타')}</category>
      <pubDate>${new Date(e.createdAt || e.date || Date.now()).toUTCString()}</pubDate>
    </item>`).join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Catholica - 가톨릭 행사 허브</title>
    <link>${SITE_URL}</link>
    <description>전국 가톨릭 피정·미사·강의·순례 행사를 한곳에서 탐색하세요.</description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
