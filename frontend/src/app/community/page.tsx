import type { Metadata } from "next";
import CommunityListClient from "./CommunityListClient";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  title: "Cenaculum — 친교의 다락방 | Catholica",
  description: "한국 가톨릭 신자들의 소통 공간. 교리문답, 신앙나눔, 기도요청, 성경공부, 전례생활을 함께 나눕니다.",
  alternates: { canonical: `${SITE_URL}/community` },
  openGraph: {
    title: "Cenaculum — 친교의 다락방 | Catholica",
    description: "한국 가톨릭 신자들의 소통 공간",
    url: `${SITE_URL}/community`,
    type: "website",
    siteName: "Catholica",
    locale: "ko_KR",
  },
};

export default function CommunityPage() {
  return <CommunityListClient />;
}
