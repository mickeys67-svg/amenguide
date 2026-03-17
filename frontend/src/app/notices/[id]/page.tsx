import type { Metadata } from "next";
import NoticeDetailClient from "./NoticeDetailClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";
const SITE_URL = "https://catholica.kr";

interface NoticeRaw {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  author?: { name: string };
}

async function fetchNotice(id: string): Promise<NoticeRaw | null> {
  try {
    const res = await fetch(`${API_BASE}/notices/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const notice = await fetchNotice(id);
  if (!notice) return { title: "공지사항을 찾을 수 없습니다" };

  const title = `${notice.title} - 공지사항`;
  const description = notice.content.replace(/<[^>]*>/g, "").slice(0, 160) || notice.title;
  const url = `${SITE_URL}/notices/${id}`;

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
    },
    twitter: { card: "summary", title, description },
  };
}

function NoticeBreadcrumbJsonLd({ notice }: { notice: NoticeRaw }) {
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "공지사항", item: `${SITE_URL}/notices` },
      { "@type": "ListItem", position: 3, name: notice.title, item: `${SITE_URL}/notices/${notice.id}` },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />;
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const notice = await fetchNotice(id);

  return (
    <>
      {notice && <NoticeBreadcrumbJsonLd notice={notice} />}
      <NoticeDetailClient />
    </>
  );
}
