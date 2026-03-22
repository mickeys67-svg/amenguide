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

// SSRF 방지: 허용 도메인만 프록시
function isAllowedUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        if (parsed.protocol !== 'https:') return false;
        const host = parsed.hostname;
        // 내부 IP 차단
        if (/^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|0\.|localhost|::1)/.test(host)) return false;
        // 허용 도메인 (교구 사이트 + 주요 가톨릭 사이트)
        const allowed = [
            'catholic.or.kr', 'cbck.or.kr', 'catholictimes.org', 'pbc.co.kr',
            'catholicbusan.or.kr', 'daegu-archdiocese.or.kr', 'djcatholic.or.kr',
            'gjcatholic.or.kr', 'cdij.or.kr', 'didio.or.kr', 'catholicdj.or.kr',
            'jjcatholic.or.kr', 'icatholic.or.kr', 'uijeongbu.or.kr',
            'suwon.catholic.or.kr', 'chuncheon.catholic.or.kr',
            'andong.catholic.or.kr', 'masan.catholic.or.kr',
            'catholicjeonju.or.kr', 'cccatholic.or.kr',
        ];
        return allowed.some(d => host === d || host.endsWith('.' + d));
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ image: null });

    // SSRF 방지
    if (!isAllowedUrl(url)) {
        return NextResponse.json({ image: null }, { status: 403 });
    }

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
