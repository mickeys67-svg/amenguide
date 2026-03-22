import type { Metadata, Viewport } from "next";
import "./globals.css";

const SITE_URL = "https://catholica.kr";
const SITE_NAME = "Catholica";
const SITE_TITLE = "Catholica | 가톨릭 행사 허브";
const SITE_DESC = "전국 가톨릭 피정·미사·강의·순례·청년·문화·선교 행사를 한곳에서 탐색하세요. 무료 행사 등록, AI 추천, 지도 검색까지.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#0B2040",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | Catholica" },
  description: SITE_DESC,
  keywords: [
    "가톨릭", "천주교", "피정", "미사", "강의", "순례", "청년", "문화", "선교",
    "가톨릭 행사", "천주교 행사", "피정 안내", "성당 행사", "교구 행사",
    "가톨릭 피정", "영성 수련", "묵상", "Catholic", "Catholica",
  ],
  authors: [{ name: "Catholica", url: SITE_URL }],
  creator: "Catholica",
  publisher: "Catholica",
  formatDetection: { telephone: true, email: true, address: true },
  alternates: {
    canonical: SITE_URL,
    languages: { "ko": SITE_URL, "x-default": SITE_URL },
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESC,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${SITE_URL}/hero.jpg`, width: 1200, height: 630, alt: "Catholica - 가톨릭 행사 허브" }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESC,
    images: [`${SITE_URL}/hero.jpg`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  verification: {
    google: "google-site-verification-placeholder",
  },
  other: {
    "naver-site-verification": "naver-site-verification-placeholder",
  },
};

// Organization + WebSite JSON-LD (server-rendered)
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
      description: SITE_DESC,
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESC,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "ko",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="alternate" type="application/rss+xml" title="Catholica RSS" href="/feed.xml" />
        {/* DNS prefetch + preconnect */}
        <link rel="dns-prefetch" href="https://amenguide-backend-775250805671.us-west1.run.app" />
        <link rel="dns-prefetch" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased" style={{ overflowX: "hidden" }}>
        {/* 접근성: skip-to-content */}
        <a href="#main-content" style={{
          position: "absolute", top: "-40px", left: 0, zIndex: 100,
          background: "#0B2040", color: "#fff", padding: "8px 16px",
          fontSize: "14px", fontFamily: "'Noto Sans KR', sans-serif",
          textDecoration: "none", transition: "top 0.2s",
        }} onFocus={undefined}>메인 콘텐츠로 이동</a>
        {children}
      </body>
    </html>
  );
}
