export interface EventData {
    id: number | string;
    title: string;
    subtitle: string;
    category: string;
    date: string;       // localized display string
    rawDate?: string;   // ISO date string for comparison
    endDate?: string;
    location: string;
    description: string;
    aiSummary?: string;
    image: string;
    originUrl?: string;
    latitude?: number;
    longitude?: number;
    createdAt?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
    피정: "#1B4080",     // deep blue
    미사: "#8B1A1A",     // deep crimson (전례색)
    강의: "#1A6B40",     // forest green
    순례: "#7B5230",     // warm brown (순례·대지)
    청년: "#0B6B70",     // deep teal
    문화: "#6E2882",     // royal purple
    선교: "#C83A1E",     // vermillion
    강론: "#6E2882",     // royal purple
    특강: "#C83A1E",     // vermillion
    피정의집: "#0B6B70", // deep teal
};

/** 기본 폴백 이미지 (피정) */
export const RETREAT_IMG = "/images/categories/retreat.svg";

/** Category-specific placeholder images (로컬 SVG — 외부 의존성 없음) */
export const CATEGORY_IMAGES: Record<string, string> = {
    피정: "/images/categories/retreat.svg",
    미사: "/images/categories/mass.svg",
    강의: "/images/categories/lecture.svg",
    순례: "/images/categories/pilgrimage.svg",
    청년: "/images/categories/youth.svg",
    문화: "/images/categories/culture.svg",
    선교: "/images/categories/mission.svg",
    강론: "/images/categories/retreat.svg",
    특강: "/images/categories/lecture.svg",
    피정의집: "/images/categories/retreat.svg",
};
