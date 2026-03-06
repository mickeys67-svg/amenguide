"use client";

import React, { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { CATEGORY_COLORS } from '@/types/event';

const API_KEY      = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID       = 'DEMO_MAP_ID';
const NEARBY_COUNT = 7;  // fitBounds 에 포함할 가까운 행사 수
const GEO_CHUNK    = 5;  // 병렬 지오코딩 동시 요청 수

interface MapProps { events?: any[]; }

/* ─── Haversine 거리 (km) ─── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R    = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a    =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function formatDist(km: number): string {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

/* ─── 이벤트 핀 ─── */
function makePinEl(color: string): HTMLElement {
    const div = document.createElement('div');
    div.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36"
             style="display:block;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35))">
            <path d="M14 0C6.268 0 0 6.268 0 14c0 8.837 14 22 14 22S28 22.837 28 14C28 6.268 21.732 0 14 0z"
                  fill="${color}" stroke="white" stroke-width="1.5"/>
            <circle cx="14" cy="14" r="5" fill="white" opacity="0.95"/>
        </svg>`;
    return div;
}

/* ─── 내 위치 파란 점 ─── */
function makeUserPinEl(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
        <div style="position:relative;width:24px;height:24px">
            <div class="uPulse" style="position:absolute;inset:0;border-radius:50%;
                background:rgba(66,133,244,0.3)"></div>
            <div style="position:absolute;top:50%;left:50%;
                transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;
                background:#4285F4;border:2.5px solid white;
                box-shadow:0 2px 8px rgba(66,133,244,0.7)"></div>
        </div>`;
    const s = document.createElement('style');
    s.textContent =
        `.uPulse{animation:uP 2s ease-out infinite}` +
        `@keyframes uP{0%{transform:scale(1);opacity:.5}70%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}`;
    wrap.appendChild(s);
    return wrap;
}

/* ─── InfoWindow ─── */
function makeInfoHtml(ev: any, color: string, distKm?: number): string {
    const dateStr = ev.date
        ? new Date(ev.date).toLocaleDateString('ko-KR', {
              year: 'numeric', month: 'long', day: 'numeric' })
        : '날짜 미정';
    const distBadge = distKm !== undefined
        ? `<span style="padding:2px 8px;border-radius:4px;background:#4285F415;
                        color:#1a73e8;font-size:10px;font-weight:700;margin-left:5px">
               🚗 ${formatDist(distKm)}</span>`
        : '';
    return `
        <div style="font-family:'Noto Sans KR',sans-serif;width:230px;padding:4px 2px">
            <div style="display:flex;align-items:center;flex-wrap:wrap;gap:4px;margin-bottom:7px">
                <span style="padding:2px 8px;border-radius:4px;background:${color}22;
                             color:${color};font-size:10px;font-weight:700;letter-spacing:.05em">
                    ${ev.category}</span>${distBadge}
            </div>
            <p style="font-size:13px;font-weight:600;color:#100F0F;line-height:1.4;margin:0 0 6px">
                ${ev.title}</p>
            <p style="font-size:11px;color:#52504B;margin:0 0 2px">📅 ${dateStr}</p>
            <p style="font-size:11px;color:#52504B;margin:0 0 12px;
                      overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                🏛 ${ev.location}</p>
            <a href="/events/${ev.id}"
               style="display:block;text-align:center;padding:8px 0;
                      background:#0B2040;color:white;border-radius:8px;
                      font-size:12px;font-weight:500;text-decoration:none">
                자세히 보기 →</a>
        </div>`;
}

/* ─── GPS ─── */
function getUserLocation(): Promise<{ lat: number; lng: number } | null> {
    return new Promise(resolve => {
        if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
            p  => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => resolve(null),
            { timeout: 7000, maximumAge: 300000 },
        );
    });
}

/* ═══════════════════════════════════════════════════════════
   메인 컴포넌트
═══════════════════════════════════════════════════════════ */
const CustomMap = ({ events = [] }: MapProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const cancelRef    = useRef(false);
    const cacheRef     = useRef<Record<string, { lat: number; lng: number } | null>>({});

    useEffect(() => {
        if (!API_KEY || !containerRef.current) return;
        cancelRef.current = false;

        (async () => {
            setOptions({ key: API_KEY, v: 'weekly', language: 'ko', region: 'KR' });

            /* ① GPS + 라이브러리 동시 로드 */
            const [userLoc, [{ Map, InfoWindow }, { AdvancedMarkerElement }, { Geocoder }]] =
                await Promise.all([
                    getUserLocation(),
                    Promise.all([
                        importLibrary('maps')      as Promise<google.maps.MapsLibrary>,
                        importLibrary('marker')    as Promise<google.maps.MarkerLibrary>,
                        importLibrary('geocoding') as Promise<google.maps.GeocodingLibrary>,
                    ]),
                ]);

            if (cancelRef.current || !containerRef.current) return;

            /* ② 지도 초기화 */
            const map = new Map(containerRef.current, {
                center:            userLoc ?? { lat: 36.5, lng: 127.8 },
                zoom:              userLoc ? 11 : 7,
                mapId:             MAP_ID,
                gestureHandling:   'cooperative',
                zoomControl:       true,
                mapTypeControl:    false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            const geocoder   = new Geocoder();
            const infoWindow = new InfoWindow();

            /* ③ 내 위치 마커 즉시 표시 (지오코딩 기다리지 않음) */
            if (userLoc) {
                new AdvancedMarkerElement({
                    position: userLoc,
                    map,
                    title:   '현재 위치',
                    content: makeUserPinEl(),
                    zIndex:  9999,
                });
            }

            /* 주소 → 좌표 캐시 */
            const geocodeAddress = async (
                address: string,
            ): Promise<{ lat: number; lng: number } | null> => {
                if (cacheRef.current[address] !== undefined) return cacheRef.current[address];
                if (/전국|해외|온라인|비대면/.test(address))
                    return (cacheRef.current[address] = null);
                const clean = address.replace(/\([^)]*\)/g, '').trim();
                try {
                    const res = await geocoder.geocode({ address: clean, region: 'KR', language: 'ko' });
                    if (res.results.length > 0) {
                        const loc = res.results[0].geometry.location;
                        return (cacheRef.current[address] = { lat: loc.lat(), lng: loc.lng() });
                    }
                } catch { /* ignore */ }
                return (cacheRef.current[address] = null);
            };

            /* ④ 전체 이벤트 좌표 확정 (5개씩 병렬 지오코딩) */
            type EvEntry = { ev: any; lat: number; lng: number; dist: number };
            const allEntries: EvEntry[] = [];

            for (let i = 0; i < events.length; i += GEO_CHUNK) {
                if (cancelRef.current) return;

                const chunk   = events.slice(i, i + GEO_CHUNK);
                const results = await Promise.all(
                    chunk.map(async (ev): Promise<EvEntry | null> => {
                        let lat = ev.latitude  as number | null;
                        let lng = ev.longitude as number | null;

                        if (!lat || !lng) {
                            const loc = ev.location;
                            if (loc && loc !== '장소 미정' && loc !== '장소 정보 없음') {
                                const c = await geocodeAddress(loc);
                                if (c) { lat = c.lat; lng = c.lng; }
                            }
                        }
                        if (!lat || !lng) return null;

                        const dist = userLoc
                            ? haversineKm(userLoc.lat, userLoc.lng, lat, lng)
                            : 0;
                        return { ev, lat, lng, dist };
                    }),
                );

                for (const r of results) if (r) allEntries.push(r);
            }

            if (cancelRef.current) return;

            /* ⑤ 거리순 정렬 */
            if (userLoc) allEntries.sort((a, b) => a.dist - b.dist);

            /* ⑥ 마커 전체 추가 */
            const color = (ev: any) => CATEGORY_COLORS[ev.category] ?? '#0B2040';
            for (const entry of allEntries) {
                const marker = new AdvancedMarkerElement({
                    position: { lat: entry.lat, lng: entry.lng },
                    map,
                    title:   entry.ev.title,
                    content: makePinEl(color(entry.ev)),
                });
                marker.addListener('gmp-click', () => {
                    infoWindow.setContent(
                        makeInfoHtml(entry.ev, color(entry.ev), userLoc ? entry.dist : undefined),
                    );
                    infoWindow.open({ anchor: marker, map });
                });
            }

            /* ⑦ fitBounds: 내 위치 + 가까운 NEARBY_COUNT 개 */
            const bounds = new google.maps.LatLngBounds();
            if (userLoc) bounds.extend(userLoc);

            const forBounds = userLoc
                ? allEntries.slice(0, NEARBY_COUNT)
                : allEntries;
            for (const e of forBounds) bounds.extend({ lat: e.lat, lng: e.lng });

            if (forBounds.length > 0 || userLoc) map.fitBounds(bounds, 60);
        })();

        return () => { cancelRef.current = true; };
    }, [events]);

    if (!API_KEY) {
        return (
            <div style={{
                width: '100%', height: '100%', background: '#0d1b2e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontFamily: "'Noto Sans KR',sans-serif", fontSize: 14 }}>
                    지도를 불러올 수 없습니다
                </p>
            </div>
        );
    }

    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default CustomMap;
