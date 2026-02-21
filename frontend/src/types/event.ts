export interface EventData {
    id: number | string;
    title: string;
    subtitle: string;
    category: string;
    date: string;
    endDate?: string;
    location: string;
    organizer: string;
    description: string;
    aiSummary?: string;
    image: string;
    duration: string;
    tags: string[];
    featured?: boolean;
    originUrl?: string;
    latitude?: number;
    longitude?: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
    피정: "#C9A96E",
    강의: "#8BB8A0",
    강론: "#9B8EC4",
    특강: "#C47B6B",
    피정의집: "#6B9BC4",
};

export const RETREAT_IMG = "https://images.unsplash.com/photo-1761048152614-c525d49f31ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25hc3RlcnklMjBzaWxlbnQlMjByZXRyZWF0JTIwbW91bnRhaW4lMjBuYXR1cmV8ZW58MXx8fHwxNzcxNTUxMDA3fDA&ixlib=rb-4.1.0&q=80&w=1080";
