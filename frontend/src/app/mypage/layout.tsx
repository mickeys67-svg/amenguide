import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "마이페이지",
  description: "즐겨찾기한 행사, 알림 설정, 계정 관리",
  robots: { index: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
