import type { Metadata } from "next";
import { Suspense } from "react";
import LuceDiFedeHome from "@/components/main/LuceDiFedeHome";

const SITE_URL = "https://catholica.kr";

interface HomeProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ searchParams }: HomeProps): Promise<Metadata> {
  const params = await searchParams;
  const diocese = params.diocese;
  const category = params.filter;

  if (diocese) {
    const title = `${diocese} 가톨릭 행사`;
    const desc = `${diocese}의 최신 피정, 미사, 강의, 순례 일정을 한눈에 확인하세요.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${SITE_URL}/?diocese=${encodeURIComponent(diocese)}` },
      openGraph: { title: `${title} | Catholica`, description: desc, url: SITE_URL },
    };
  }

  if (category && category !== "전체") {
    const title = `가톨릭 ${category} 행사`;
    const desc = `전국 ${category} 행사 일정을 탐색하세요. 피정, 미사, 강의, 순례 등 다양한 행사 정보.`;
    return {
      title,
      description: desc,
      alternates: { canonical: `${SITE_URL}/?filter=${encodeURIComponent(category)}` },
      openGraph: { title: `${title} | Catholica`, description: desc, url: SITE_URL },
    };
  }

  return { alternates: { canonical: SITE_URL } };
}

async function getEvents(retry = true): Promise<{ data: any[]; total: number; categoryCounts?: Record<string, number> }> {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s (콜드 스타트 대응)
    const res = await fetch(`${backendUrl}/events?page=1&pageSize=15`, {
      next: { revalidate: false },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!res.ok) {
      if (retry) return getEvents(false);
      return { data: [], total: 0 };
    }
    return res.json();
  } catch {
    if (retry) return getEvents(false);
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
      <Suspense>
        <LuceDiFedeHome initialEvents={events} initialTotal={total} initialCategoryCounts={categoryCounts} />
      </Suspense>
    </main>
  );
}
