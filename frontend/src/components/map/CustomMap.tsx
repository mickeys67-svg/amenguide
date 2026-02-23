"use client";

import React, { useEffect, useState } from 'react';

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

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY;
        if (!apiKey) { setMapError(true); return; }

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

        function initMap() {
            if (!window.kakao?.maps) { setMapError(true); return; }
            window.kakao.maps.load(() => {
                const container = document.getElementById('map');
                if (!container) return;
                const options = {
                    center: new window.kakao.maps.LatLng(36.5, 127.8),
                    level: 8,
                };
                const map = new window.kakao.maps.Map(container, options);
                const eventsWithCoords = events.filter(e => e.latitude && e.longitude);
                if (eventsWithCoords.length > 0) {
                    const bounds = new window.kakao.maps.LatLngBounds();
                    eventsWithCoords.forEach(event => {
                        const position = new window.kakao.maps.LatLng(event.latitude, event.longitude);
                        new window.kakao.maps.Marker({ position, map });
                        bounds.extend(position);
                    });
                    if (!bounds.isEmpty()) map.setBounds(bounds);
                }
            });
        }
    }, [events]);

    if (mapError) {
        return (
            <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center"
                style={{ backgroundColor: '#0d0b09' }}>
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
