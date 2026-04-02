export interface EventData {
  id: number | string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  rawDate?: string;
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
  피정: '#1B4080',
  미사: '#8B1A1A',
  강의: '#1A6B40',
  순례: '#7B5230',
  청년: '#0B6B70',
  문화: '#6E2882',
  선교: '#C83A1E',
  강론: '#6E2882',
  특강: '#C83A1E',
  피정의집: '#0B6B70',
};

export const CATEGORIES = ['전체', '피정', '미사', '강의', '순례', '청년', '문화', '선교'] as const;
