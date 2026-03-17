import type { Metadata } from "next";
import NoticesListClient from "./NoticesListClient";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  title: "공지사항",
  description: "Catholica 공지사항 - 가톨릭 행사 허브의 새로운 소식과 업데이트를 확인하세요.",
  alternates: { canonical: `${SITE_URL}/notices` },
  openGraph: {
    title: "공지사항 | Catholica",
    description: "Catholica 공지사항 - 새로운 소식과 업데이트",
    url: `${SITE_URL}/notices`,
    type: "website",
    siteName: "Catholica",
    locale: "ko_KR",
  },
};

export default function NoticesPage() {
  return <NoticesListClient />;
}
