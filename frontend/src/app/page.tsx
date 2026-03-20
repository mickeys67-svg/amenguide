import type { Metadata } from "next";
import LuceDiFedeHome from "@/components/main/LuceDiFedeHome";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

async function getEvents() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";
  try {
    const res = await fetch(`${backendUrl}/events?page=1&pageSize=15`, {
      next: { revalidate: false },
    });
    if (!res.ok) return { data: [], total: 0 };
    return res.json();
  } catch {
    return { data: [], total: 0 };
  }
}

interface EventItem { id: string; title: string; category?: string; date?: string; location?: string; }

function HomeJsonLd({ events }: { events: EventItem[] }) {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "가톨릭 행사 목록",
    numberOfItems: events.length,
    itemListElement: events.slice(0, 20).map((e, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${SITE_URL}/events/${e.id}`,
      name: e.title,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList).replace(/<\//g, '<\\/') }} />;
}

export default async function Home() {
  const result = await getEvents();
  const events = result.data ?? (Array.isArray(result) ? result : []);
  const total = result.total ?? events.length;
  const categoryCounts = result.categoryCounts ?? {};
  return (
    <main>
      <HomeJsonLd events={events} />
      <LuceDiFedeHome initialEvents={events} initialTotal={total} initialCategoryCounts={categoryCounts} />
    </main>
  );
}
