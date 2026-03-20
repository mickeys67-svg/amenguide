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

export default async function CommunityDetailPage({ params }: Props) {
  const { id } = await params;
  return <CommunityDetailClient postId={id} />;
}
