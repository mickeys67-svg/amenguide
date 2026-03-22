import type { Metadata } from "next";
import EventDetailClient from "./EventDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";
const SITE_URL = "https://catholica.kr";

interface EventRaw {
  id: string;
  title: string;
  category?: string;
  date?: string;
  location?: string;
  description?: string;
  aiSummary?: string;
  imageUrl?: string;
  diocese?: string;
  source?: string;
}

async function fetchEvent(id: string): Promise<EventRaw | null> {
  try {
    const res = await fetch(`${API_BASE}/events/${id}`, { next: { revalidate: 21600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEvent(id);
  if (!event) return { title: "행사를 찾을 수 없습니다" };

  const title = event.title;
  const description = (event.aiSummary || event.description || `${event.title} - ${event.category || "가톨릭"} 행사 정보`).slice(0, 160);
  const url = `${SITE_URL}/events/${id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Catholica",
      locale: "ko_KR",
      ...(event.imageUrl ? { images: [{ url: event.imageUrl, width: 1200, height: 630, alt: title }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(event.imageUrl ? { images: [event.imageUrl] } : {}),
    },
    other: {
      "article:section": event.category || "가톨릭 행사",
      ...(event.date ? { "article:published_time": event.date } : {}),
    },
  };
}

// Server-rendered JSON-LD for event (crawlable)
function EventJsonLdServer({ event }: { event: EventRaw }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.aiSummary || event.description || "",
    ...(event.date ? { startDate: event.date } : {}),
    ...(event.location ? { location: { "@type": "Place", name: event.location, ...(event.diocese ? { address: { "@type": "PostalAddress", addressRegion: event.diocese } } : {}) } } : {}),
    organizer: { "@type": "Organization", name: "Catholica", url: SITE_URL },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: `${SITE_URL}/events/${event.id}`,
    ...(event.imageUrl ? { image: event.imageUrl } : {}),
    ...(event.source ? { isBasedOn: event.source } : {}),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "행사", item: `${SITE_URL}/#events` },
      { "@type": "ListItem", position: 3, name: event.title, item: `${SITE_URL}/events/${event.id}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, '<\\/') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb).replace(/<\//g, '<\\/') }} />
    </>
  );
}

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await fetchEvent(id);

  return (
    <>
      {event && <EventJsonLdServer event={event} />}
      <EventDetailClient />
    </>
  );
}
