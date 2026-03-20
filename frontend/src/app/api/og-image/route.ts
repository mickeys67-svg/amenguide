import { NextRequest, NextResponse } from 'next/server';

// 인메모리 캐시 (URL → image URL, 최대 500개, 1시간 TTL)
const cache = new Map<string, { image: string | null; ts: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간
const CACHE_MAX = 500;

function getCached(key: string): string | null | undefined {
    const entry = cache.get(key);
    if (!entry) return undefined;
    if (Date.now() - entry.ts > CACHE_TTL) {
        cache.delete(key);
        return undefined;
    }
    return entry.image;
}

function setCache(key: string, image: string | null) {
    // LRU 간이 구현: 최대 초과 시 가장 오래된 항목 삭제
    if (cache.size >= CACHE_MAX) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { image, ts: Date.now() });
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ image: null });

    // 캐시 확인
    const cached = getCached(url);
    if (cached !== undefined) {
        return NextResponse.json(
            { image: cached },
            { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
        );
    }

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
            setCache(url, null);
            return NextResponse.json({ image: null });
        }

        const html = await res.text();

        // og:image (property or name attribute order varies)
        const ogMatch =
            html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogMatch?.[1]) {
            const img = ogMatch[1].trim();
            const abs = img.startsWith('http') ? img : new URL(img, url).href;
            setCache(url, abs);
            return NextResponse.json(
                { image: abs },
                { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
            );
        }

        // twitter:image fallback
        const twMatch =
            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

        if (twMatch?.[1]) {
            const img = twMatch[1].trim();
            const abs = img.startsWith('http') ? img : new URL(img, url).href;
            setCache(url, abs);
            return NextResponse.json(
                { image: abs },
                { headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' } },
            );
        }

        setCache(url, null);
        return NextResponse.json({ image: null });
    } catch {
        setCache(url, null);
        return NextResponse.json({ image: null });
    }
}
