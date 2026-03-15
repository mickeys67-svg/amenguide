import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover" as const,
};

export const metadata: Metadata = {
  title: "Catholica | 가톨릭 행사 허브",
  description: "하느님의 은총을 따르는 길, 전국 가톨릭 행사 및 피정 안내 가이드",
  openGraph: {
    title: "Catholica | 가톨릭 행사 허브",
    description: "전국 가톨릭 피정·강의·강론·특강 정보를 한곳에서",
    url: "https://catholica.kr",
    siteName: "Catholica",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Catholica | 가톨릭 행사 허브",
    description: "전국 가톨릭 피정·강의·강론·특강 정보를 한곳에서",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased" style={{ overflowX: "hidden" }}>
        {children}
      </body>
    </html>
  );
}
