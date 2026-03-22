import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "회원가입",
  description: "Catholica 회원가입 — 무료로 가입하고 행사 즐겨찾기, 알림 등 다양한 기능을 이용하세요.",
  robots: { index: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
