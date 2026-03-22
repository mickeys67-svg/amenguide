import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "로그인",
  description: "Catholica에 로그인하여 행사 즐겨찾기, AI 상담 등 다양한 기능을 이용하세요.",
  robots: { index: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
