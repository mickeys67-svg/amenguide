"use client";

import React, { useEffect, useRef, useState } from 'react';

declare global {
    interface Window {
        kakao: any;
    }
}

interface MapProps {
    events?: any[];
}

const CustomMap = ({ events = [] }: MapProps) => {
    const [mapError, setMapError] = useState(false);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);

    // Effect 1: 지도 초기화 — 1회만 실행
    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
        if (!apiKey) { setMapError(true); return; }

        function initMap() {
            if (!window.kakao?.maps) { setMapError(true); return; }
            window.kakao.maps.load(() => {
                const container = document.getElementById('map');
                if (!container) return;
                const options = {
                    center: new window.kakao.maps.LatLng(36.5, 127.8),
                    level: 8,
                };
                mapInstanceRef.current = new window.kakao.maps.Map(container, options);
            });
        }

        const existingScript = document.getElementById('kakao-map-sdk');
        if (existingScript) {
            if (window.kakao?.maps) initMap();
            return;
        }

        const script = document.createElement('script');
        script.id = 'kakao-map-sdk';
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${apiKey}&autoload=false`;
        script.async = true;
        document.head.appendChild(script);
        script.onload = () => initMap();
        script.onerror = () => setMapError(true);
    }, []); // deps: [] → 마운트 시 1회만

    // Effect 2: 마커 업데이트 — events 변경 시만
    useEffect(() => {
        if (!mapInstanceRef.current || !window.kakao?.maps) return;

        // 기존 마커 제거
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        const eventsWithCoords = events.filter(e => e.latitude && e.longitude);
        if (eventsWithCoords.length === 0) return;

        const bounds = new window.kakao.maps.LatLngBounds();
        eventsWithCoords.forEach(event => {
            const position = new window.kakao.maps.LatLng(event.latitude, event.longitude);
            const marker = new window.kakao.maps.Marker({ position, map: mapInstanceRef.current });
            markersRef.current.push(marker);
            bounds.extend(position);
        });
        if (!bounds.isEmpty()) mapInstanceRef.current.setBounds(bounds);
    }, [events]);

    if (mapError) {
        return (
            <div
                className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{ backgroundColor: '#0d0b09' }}
            >
                <p style={{ color: 'rgba(245,240,232,0.3)', fontFamily: "'Noto Sans KR', sans-serif", fontSize: '14px' }}>
                    지도를 불러올 수 없습니다
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div id="map" className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-[12px] border-[#C9A96E]/10 rounded-2xl" />
        </div>
    );
};

export default CustomMap;
