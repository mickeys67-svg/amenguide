import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "행사 등록",
  description: "가톨릭 행사를 무료로 등록하고 전국 신자들에게 알리세요.",
  alternates: { canonical: "https://catholica.kr/register-event" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
