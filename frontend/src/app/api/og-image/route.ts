import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) return NextResponse.json({ image: null });

    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) return NextResponse.json({ image: null });

        const html = await res.text();

        // og:image (property or name attribute order varies)
        const ogMatch =
            html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);

        if (ogMatch?.[1]) {
            const img = ogMatch[1].trim();
            const abs = img.startsWith('http') ? img : new URL(img, url).href;
            return NextResponse.json({ image: abs });
        }

        // twitter:image fallback
        const twMatch =
            html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
            html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);

        if (twMatch?.[1]) {
            const img = twMatch[1].trim();
            const abs = img.startsWith('http') ? img : new URL(img, url).href;
            return NextResponse.json({ image: abs });
        }

        return NextResponse.json({ image: null });
    } catch {
        return NextResponse.json({ image: null });
    }
}
