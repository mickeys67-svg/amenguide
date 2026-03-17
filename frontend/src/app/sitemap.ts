import type { MetadataRoute } from "next";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";

const SITE_URL = "https://catholica.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticPages: MetadataRoute.Sitemap = [
        { url: SITE_URL, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
        { url: `${SITE_URL}/notices`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
        { url: `${SITE_URL}/faq`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
        { url: `${SITE_URL}/login`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
        { url: `${SITE_URL}/register`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
        { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
        { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
    ];

    let eventPages: MetadataRoute.Sitemap = [];
    let noticePages: MetadataRoute.Sitemap = [];

    try {
        const res = await fetch(`${API_BASE}/events`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const events: { id: string; updatedAt?: string }[] = await res.json();
            eventPages = events.map((ev) => ({
                url: `${SITE_URL}/events/${ev.id}`,
                lastModified: ev.updatedAt ? new Date(ev.updatedAt) : new Date(),
                changeFrequency: "weekly" as const,
                priority: 0.7,
            }));
        }
    } catch {}

    try {
        const res = await fetch(`${API_BASE}/notices?page=1&limit=100`, { next: { revalidate: 3600 } });
        if (res.ok) {
            const body = await res.json();
            const notices: { id: string; updatedAt?: string; createdAt?: string }[] = body.data || [];
            noticePages = notices.map((n) => ({
                url: `${SITE_URL}/notices/${n.id}`,
                lastModified: n.updatedAt ? new Date(n.updatedAt) : n.createdAt ? new Date(n.createdAt) : new Date(),
                changeFrequency: "monthly" as const,
                priority: 0.5,
            }));
        }
    } catch {}

    return [...staticPages, ...eventPages, ...noticePages];
}
