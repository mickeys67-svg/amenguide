import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "글쓰기 — 친교의 다락방",
  robots: { index: false },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
