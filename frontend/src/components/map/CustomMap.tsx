"use client";

import React, { useEffect } from 'react';

declare global {
    interface Window {
        kakao: any;
    }
}

interface MapProps {
    events?: any[];
}

const CustomMap = ({ events = [] }: MapProps) => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY}&autoload=false`;
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.kakao.maps.load(() => {
                const container = document.getElementById('map');
                const options = {
                    center: new window.kakao.maps.LatLng(37.5665, 126.9780),
                    level: 3,
                };
                const map = new window.kakao.maps.Map(container, options);

                if (events.length > 0) {
                    const bounds = new window.kakao.maps.LatLngBounds();

                    events.forEach(event => {
                        // In mock data, latitude/longitude might not exist, 
                        // but let's assume we add them or have a default for now.
                        // For demo, we might use some offsets if not provided.
                        if (event.latitude && event.longitude) {
                            const position = new window.kakao.maps.LatLng(event.latitude, event.longitude);
                            const marker = new window.kakao.maps.Marker({
                                position: position,
                                map: map
                            });
                            bounds.extend(position);
                        }
                    });

                    if (!bounds.isEmpty()) {
                        map.setBounds(bounds);
                    }
                }

                // 커스텀 스타일: 다크 모드 느낌을 위한 지도 필터나 커스텀 앱 구현은 SDK 제약이 있으나
                // 마커는 스테인드글라스 스타일로 커스텀 가능
                const markerImage = new window.kakao.maps.MarkerImage(
                    '/gem-marker.svg', // 사용자가 생성해주거나 따로 마련할 아이콘
                    new window.kakao.maps.Size(40, 40)
                );

                const marker = new window.kakao.maps.Marker({
                    position: map.getCenter(),
                    image: markerImage,
                });

                marker.setMap(map);
            });
        };
    }, []);

    return (
        <div className="w-full h-[500px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative">
            <div id="map" className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-[12px] border-[#C9A96E]/10 rounded-2xl" />
        </div>
    );
};

export default CustomMap;
