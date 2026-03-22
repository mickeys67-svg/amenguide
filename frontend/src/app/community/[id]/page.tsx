import type { Metadata } from "next";
import CommunityDetailClient from "./CommunityDetailClient";

const SITE_URL = "https://catholica.kr";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const API = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";
  try {
    const res = await fetch(`${API}/community/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error("not found");
    const post = await res.json();
    return {
      title: `${post.title} | Cenaculum`,
      description: post.content.slice(0, 160),
      alternates: { canonical: `${SITE_URL}/community/${id}` },
      openGraph: {
        title: post.title,
        description: post.content.slice(0, 160),
        url: `${SITE_URL}/community/${id}`,
        type: "article",
        siteName: "Catholica",
        locale: "ko_KR",
      },
    };
  } catch {
    return { title: "게시글 | Cenaculum" };
  }
}

async function CommunityJsonLd({ id }: { id: string }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";
  try {
    const res = await fetch(`${API}/community/${id}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const post = await res.json();
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "친교의 다락방", item: `${SITE_URL}/community` },
            { "@type": "ListItem", position: 3, name: post.title, item: `${SITE_URL}/community/${id}` },
          ],
        },
        {
          "@type": "BlogPosting",
          headline: post.title,
          articleBody: post.content?.slice(0, 500),
          datePublished: post.createdAt,
          author: { "@type": "Person", name: post.author?.name || "익명" },
          publisher: { "@type": "Organization", name: "Catholica", logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` } },
          mainEntityOfPage: `${SITE_URL}/community/${id}`,
          inLanguage: "ko",
        },
      ],
    };
    return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/<\//g, '<\\/') }} />;
  } catch { return null; }
}

export default async function CommunityDetailPage({ params }: Props) {
  const { id } = await params;
  return (
    <>
      <CommunityJsonLd id={id} />
      <CommunityDetailClient postId={id} />
    </>
  );
}
