export interface EventData {
    id: number | string;
    title: string;
    subtitle: string;
    category: string;
    date: string;       // localized display string
    rawDate?: string;   // ISO date string for comparison
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
    createdAt?: string;
}

export const CATEGORY_COLORS: Record<string, string> = {
    피정: "#1B4080",  // deep blue
    미사: "#8B1A1A",  // deep crimson (전례색)
    강의: "#1A6B40",  // forest green
    순례: "#7B5230",  // warm brown (순례·대지)
    청년: "#0B6B70",  // deep teal
    문화: "#6E2882",  // royal purple
    선교: "#C83A1E",  // vermillion
};

export const RETREAT_IMG = "https://images.unsplash.com/photo-1761048152614-c525d49f31ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25hc3RlcnklMjBzaWxlbnQlMjByZXRyZWF0JTIwbW91bnRhaW4lMjBuYXR1cmV8ZW58MXx8fHwxNzcxNTUxMDA3fDA&ixlib=rb-4.1.0&q=80&w=1080";

/** Category-specific church images shown in event cards */
export const CATEGORY_IMAGES: Record<string, string> = {
    피정: "https://images.pexels.com/photos/34192029/pexels-photo-34192029.jpeg?auto=compress&cs=tinysrgb&w=800",
    미사: "https://images.pexels.com/photos/16376254/pexels-photo-16376254.jpeg?auto=compress&cs=tinysrgb&w=800",
    강의: "https://images.pexels.com/photos/7168678/pexels-photo-7168678.jpeg?auto=compress&cs=tinysrgb&w=800",
    순례: "https://images.pexels.com/photos/19664221/pexels-photo-19664221.jpeg?auto=compress&cs=tinysrgb&w=800",
    청년: "https://images.pexels.com/photos/30737060/pexels-photo-30737060.jpeg?auto=compress&cs=tinysrgb&w=800",
    문화: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800",
    선교: "https://images.pexels.com/photos/6646917/pexels-photo-6646917.jpeg?auto=compress&cs=tinysrgb&w=800",
};
