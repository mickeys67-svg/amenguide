"use client";

import { useState, useRef, useMemo, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { FilterBar } from "./FilterBar";
import { EventCard } from "./EventCard";
import { Footer } from "./Footer";
import { SearchModal } from "./SearchModal";
import CustomMap from "../map/CustomMap";
import { EventData, RETREAT_IMG } from "../../types/event";
import { apiFetch } from "../../utils/api";
import { ArrowRight, MapPin, PlusCircle, LogIn } from "lucide-react";

/* ── 아이콘 SVG (카테고리별) ─────────────────────────────────────────────── */
const CATEGORY_ICONS: Record<string, ReactNode> = {
    피정: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
    ),
    미사: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M2 12h20"/>
        </svg>
    ),
    강의: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
    ),
    순례: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
    ),
    청년: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
    ),
    문화: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
        </svg>
    ),
    선교: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
    ),
};

// ── 두 좌표 간 거리 계산 (km) — Haversine formula ─────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CATEGORY_QUICK = [
    { label: "피정", color: "#1B4080", desc: "피정 · 묵상 · 영성수련" },
    { label: "미사", color: "#8B1A1A", desc: "미사 · 전례 · 기도회"   },
    { label: "강의", color: "#1A6B40", desc: "강좌 · 성경 · 교리"     },
    { label: "순례", color: "#7B5230", desc: "성지순례 · 도보순례"    },
    { label: "청년", color: "#0B6B70", desc: "청년 · 청소년 · Youth"  },
    { label: "문화", color: "#6E2882", desc: "음악회 · 공연 · 전시"   },
    { label: "선교", color: "#C83A1E", desc: "선교 · 봉사 · 사회사목" },
];

export default function LuceDiFedeHome() {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState("전체");
    const [sortBy, setSortBy] = useState("date");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchOpen, setSearchOpen] = useState(false);
    const eventsRef = useRef<HTMLDivElement>(null);

    // ── GPS 상태 ────────────────────────────────────────────────────────────
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);

    const handleSortChange = (sort: string) => {
        if (sort !== "distance") {
            setSortBy(sort);
            setGeoError(null);
            return;
        }
        // 이미 위치 획득 완료 → 바로 적용
        if (userLocation) {
            setSortBy("distance");
            return;
        }
        if (!navigator.geolocation) {
            setGeoError("브라우저가 위치 기능을 지원하지 않습니다");
            return;
        }
        setGeoLoading(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoLoading(false);
                setSortBy("distance");
            },
            () => {
                setGeoError("위치 권한이 거부되었습니다");
                setGeoLoading(false);
            },
            { timeout: 10000, maximumAge: 300_000 },
        );
    };

    const [events, setEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiFetch<EventData[]>("/events");
                if (data && data.length > 0) {
                    const mappedEvents: EventData[] = data.map((e) => ({
                        id: e.id,
                        title: e.title,
                        subtitle: e.category || "",
                        category: e.category || "피정",
                        date: e.date ? new Date(e.date).toLocaleDateString("ko-KR") : "연중 상시",
                        rawDate: e.date || undefined,
                        location: e.location || "장소미정",
                        organizer: "Catholica",
                        description: e.aiSummary || "",
                        aiSummary: e.aiSummary,
                        image: RETREAT_IMG,
                        duration: "상세참조",
                        tags: [],
                        featured: false,
                        latitude: e.latitude,
                        longitude: e.longitude,
                        originUrl: e.originUrl,
                        createdAt: e.createdAt,
                    }));
                    setEvents(mappedEvents);
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : "Failed to load events.";
                console.error("Fetch failed:", err);
                setError(msg);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const filteredEvents = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let list = events.filter((e) => {
            if (!e.rawDate) return true;
            const d = new Date(e.rawDate);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });

        if (activeFilter !== "전체") {
            list = list.filter((e) => e.category === activeFilter);
        }

        if (sortBy === "latest") {
            list.sort((a, b) => {
                const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return tB - tA;
            });
        } else if (sortBy === "distance" && userLocation) {
            list.sort((a, b) => {
                const hasA = a.latitude != null && a.longitude != null;
                const hasB = b.latitude != null && b.longitude != null;
                if (!hasA && !hasB) return 0;
                if (!hasA) return 1;   // 좌표 없으면 뒤로
                if (!hasB) return -1;
                const dA = haversineKm(userLocation.lat, userLocation.lng, a.latitude!, a.longitude!);
                const dB = haversineKm(userLocation.lat, userLocation.lng, b.latitude!, b.longitude!);
                return dA - dB;
            });
        } else {
            // 기본: 날짜 가까운순
            list.sort((a, b) => {
                if (!a.rawDate) return 1;
                if (!b.rawDate) return -1;
                return new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime();
            });
        }

        return list;
    }, [activeFilter, sortBy, events, userLocation]);

    const countByCategory = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // filteredEvents 와 동일한 날짜 기준 — 과거 행사 제외
        const upcoming = events.filter((e) => {
            if (!e.rawDate) return true;
            const d = new Date(e.rawDate);
            d.setHours(0, 0, 0, 0);
            return d >= today;
        });
        const map: Record<string, number> = {};
        CATEGORY_QUICK.forEach((c) => {
            map[c.label] = upcoming.filter((e) => e.category === c.label).length;
        });
        return map;
    }, [events]);

    const scrollToEvents = () => {
        const el = eventsRef.current;
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 110;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
    };

    return (
        <div style={{ backgroundColor: "#F8F7F4", minHeight: "100vh" }}>
            <Navigation
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onSearchOpen={() => setSearchOpen(true)}
            />

            {/* ════════════════════════════════════
                HERO — 밝고 시원한 스플릿 레이아웃
            ════════════════════════════════════ */}
            <Hero eventCount={events.length} onScrollDown={scrollToEvents} />

            {/* ════════════════════════════════════
                EVENTS SECTION
            ════════════════════════════════════ */}
            <section ref={eventsRef} id="events" style={{ backgroundColor: "#F8F7F4", paddingBottom: "96px" }}>

                {/* ── 카테고리 타일 ──────────────────────────────────────── */}
                <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E5DF" }}>
                    <div className="sacred-rail">
                        {/* 반응형 타일 그리드
                            Desktop  (>900px) : 7열 1행
                            Tablet   (600-900): 4열 wrap
                            Mobile   (<600px) : 가로 스크롤 (flex)
                        */}
                        <style>{`
                            .cat-tiles {
                                display: flex;
                                overflow-x: auto;
                                scrollbar-width: none;
                                gap: 10px;
                                padding: 20px 0;
                            }
                            .cat-tiles::-webkit-scrollbar { display: none; }
                            .cat-tile {
                                flex: 0 0 auto;
                                width: clamp(100px, 13vw, 152px);
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                gap: 10px;
                                padding: 18px 10px 14px;
                                border-radius: 14px;
                                border: 1.5px solid #E8E5DF;
                                background: #FFFFFF;
                                cursor: pointer;
                                transition: all 0.18s ease;
                                text-align: center;
                                position: relative;
                                overflow: hidden;
                            }
                            .cat-tile:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 8px 24px rgba(0,0,0,0.09);
                            }
                            .cat-tile.active {
                                border-color: transparent;
                                color: #FFFFFF;
                                box-shadow: 0 6px 20px rgba(0,0,0,0.18);
                            }
                            @media (min-width: 620px) {
                                .cat-tiles {
                                    display: grid;
                                    grid-template-columns: repeat(4, 1fr);
                                    overflow-x: visible;
                                }
                            }
                            @media (min-width: 940px) {
                                .cat-tiles {
                                    grid-template-columns: repeat(7, 1fr);
                                }
                            }
                        `}</style>

                        <div className="cat-tiles">
                            {CATEGORY_QUICK.map((cat) => {
                                const isActive = activeFilter === cat.label;
                                const count = countByCategory[cat.label] ?? 0;
                                return (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        className={`cat-tile${isActive ? " active" : ""}`}
                                        onClick={() => setActiveFilter(
                                            isActive ? "전체" : cat.label
                                        )}
                                        style={{
                                            backgroundColor: isActive ? cat.color : "#FFFFFF",
                                            color: isActive ? "#FFFFFF" : cat.color,
                                            border: `1.5px solid ${isActive ? cat.color : "#E8E5DF"}`,
                                        }}
                                    >
                                        {/* 아이콘 */}
                                        <span style={{ opacity: isActive ? 1 : 0.85 }}>
                                            {CATEGORY_ICONS[cat.label]}
                                        </span>

                                        {/* 레이블 */}
                                        <span style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontWeight: 600,
                                            fontSize: "13px",
                                            letterSpacing: "-0.01em",
                                            color: "inherit",
                                            lineHeight: 1,
                                        }}>
                                            {cat.label}
                                        </span>

                                        {/* 카운트 */}
                                        <span style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "18px",
                                            fontWeight: 700,
                                            lineHeight: 1,
                                            color: isActive ? "rgba(255,255,255,0.9)" : cat.color,
                                        }}>
                                            {count}
                                        </span>

                                        {/* 활성 상태 top accent bar */}
                                        {isActive && (
                                            <span style={{
                                                position: "absolute",
                                                top: 0,
                                                left: 0,
                                                right: 0,
                                                height: "3px",
                                                backgroundColor: "rgba(255,255,255,0.4)",
                                                borderRadius: "14px 14px 0 0",
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* 전체 보기 버튼 — 카테고리 선택 시 표시 */}
                {activeFilter !== "전체" && (
                    <div className="sacred-rail" style={{ paddingTop: "14px" }}>
                        <button
                            type="button"
                            onClick={() => setActiveFilter("전체")}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "12px",
                                color: "#52504B",
                                background: "none",
                                border: "1.5px solid #E8E5DF",
                                borderRadius: "100px",
                                padding: "4px 12px",
                                cursor: "pointer",
                            }}
                        >
                            ✕ 필터 해제 · 전체 보기
                        </button>
                    </div>
                )}

                <FilterBar
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    totalCount={filteredEvents.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    geoLoading={geoLoading}
                    geoError={geoError}
                    userLocation={userLocation}
                />

                <div className="sacred-rail" style={{ paddingTop: "44px" }}>
                    {/* Section heading */}
                    <motion.div
                        key={activeFilter}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35 }}
                        style={{ marginBottom: "28px" }}
                    >
                        <h2 style={{
                            fontFamily: "'Noto Serif KR', serif",
                            fontWeight: 700,
                            fontSize: "clamp(24px, 3vw, 38px)",
                            color: "#100F0F",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                        }}>
                            {activeFilter === "전체" ? "모든 행사" : activeFilter}
                        </h2>
                        <p style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "12px",
                            color: "#9C9891",
                            marginTop: "5px",
                        }}>
                            {filteredEvents.length} results
                        </p>
                    </motion.div>

                    {/* Loading */}
                    {isLoading ? (
                        <div style={{ display: "flex", justifyContent: "center", padding: "96px 0" }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                                style={{
                                    width: "36px", height: "36px",
                                    borderRadius: "50%",
                                    border: "2px solid #E8E5DF",
                                    borderTopColor: "#0B2040",
                                }}
                            />
                        </div>
                    ) : error ? (
                        <div style={{ textAlign: "center", padding: "80px 0" }}>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "#9C9891", fontSize: "15px" }}>
                                {error}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    marginTop: "16px",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "14px",
                                    color: "#0B2040",
                                    textDecoration: "underline",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                }}
                            >
                                다시 시도
                            </button>
                        </div>
                    ) : filteredEvents.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{ textAlign: "center", padding: "80px 0" }}
                        >
                            <p style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "26px",
                                fontWeight: 600,
                                color: "#D0CDC7",
                            }}>
                                등록된 행사가 없습니다
                            </p>
                            <p style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "14px",
                                color: "#9C9891",
                                marginTop: "10px",
                            }}>
                                다른 카테고리를 선택해 보세요
                            </p>
                        </motion.div>
                    ) : viewMode === "grid" ? (
                        <motion.div
                            key={`grid-${activeFilter}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            style={{
                                display: "grid",
                                /* 고정 3컬럼 — 카드 높이 균일 */
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gridAutoRows: "1fr",
                                gap: "22px",
                            }}
                        >
                            {filteredEvents.map((event, i) => (
                                <EventCard key={event.id} event={event} index={i} variant="grid" />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`list-${activeFilter}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                        >
                            {/* List header */}
                            <div
                                className="hidden md:grid pb-3 mb-1"
                                style={{
                                    gridTemplateColumns: "32px 1fr 80px 120px 110px 20px",
                                    gap: "16px",
                                    borderBottom: "1px solid #E8E5DF",
                                }}
                            >
                                {["NO.", "행사명", "카테고리", "날짜", "장소", ""].map((h, idx) => (
                                    <span key={idx} style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "10px",
                                        color: "#9C9891",
                                        letterSpacing: "0.1em",
                                        textTransform: "uppercase",
                                    }}>
                                        {h}
                                    </span>
                                ))}
                            </div>
                            {filteredEvents.map((event, i) => (
                                <EventCard key={event.id} event={event} index={i} variant="list" />
                            ))}
                        </motion.div>
                    )}
                </div>
            </section>

            {/* ════════════════════════════════════
                MAP SECTION
            ════════════════════════════════════ */}
            <section id="map" style={{ backgroundColor: "#0B2040", padding: "72px 0" }}>
                <div className="sacred-rail">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "20px" }}>
                            <div>
                                <span style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "10px",
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: "rgba(255,255,255,0.35)",
                                    display: "block",
                                    marginBottom: "12px",
                                }}>
                                    Location
                                </span>
                                <h2 style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    fontSize: "clamp(24px, 3.5vw, 40px)",
                                    fontWeight: 700,
                                    color: "#FFFFFF",
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.25,
                                }}>
                                    주변의 행사를<br />지도에서 찾아보세요
                                </h2>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", opacity: 0.45 }}>
                                <MapPin size={13} color="white" />
                                <span style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "12px",
                                    color: "#FFFFFF",
                                    fontWeight: 300,
                                }}>
                                    마커를 클릭하면 행사 상세정보를 볼 수 있습니다
                                </span>
                            </div>
                        </div>
                        <div
                            style={{
                                height: "420px",
                                borderRadius: "16px",
                                overflow: "hidden",
                                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
                            }}
                        >
                            <CustomMap events={filteredEvents} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ════════════════════════════════════
                CTA SECTION — 행사 등록 + 로그인
            ════════════════════════════════════ */}
            <style>{`
                .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                @media (max-width: 720px) { .cta-grid { grid-template-columns: 1fr; } }
            `}</style>
            <section style={{ backgroundColor: "#F8F7F4", padding: "96px 0" }}>
                <div className="sacred-rail">

                    {/* 섹션 eyebrow */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "48px", justifyContent: "center" }}>
                        <div style={{ height: "1px", width: "36px", backgroundColor: "#C9A96E" }} />
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "10px",
                            letterSpacing: "0.22em",
                            textTransform: "uppercase" as const,
                            color: "#C9A96E",
                        }}>
                            Get Started
                        </span>
                        <div style={{ height: "1px", width: "36px", backgroundColor: "#C9A96E" }} />
                    </div>

                    <div className="cta-grid">

                        {/* ── 카드 1: 행사 등록 ────────────────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: 0 }}
                            style={{
                                backgroundColor: "#0B2040",
                                borderRadius: "20px",
                                padding: "clamp(32px, 5vw, 52px)",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: "0px",
                                position: "relative" as const,
                                overflow: "hidden" as const,
                            }}
                        >
                            {/* 배경 장식 */}
                            <div style={{
                                position: "absolute",
                                top: "-40px", right: "-40px",
                                width: "180px", height: "180px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(201,169,110,0.08)",
                                pointerEvents: "none",
                            }} />
                            <div style={{
                                position: "absolute",
                                bottom: "-20px", right: "60px",
                                width: "100px", height: "100px",
                                borderRadius: "50%",
                                backgroundColor: "rgba(201,169,110,0.05)",
                                pointerEvents: "none",
                            }} />

                            {/* 아이콘 */}
                            <div style={{
                                width: "52px", height: "52px",
                                borderRadius: "14px",
                                backgroundColor: "rgba(201,169,110,0.15)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "28px",
                                color: "#C9A96E",
                            }}>
                                <PlusCircle size={26} />
                            </div>

                            {/* 배지 */}
                            <span style={{
                                display: "inline-block",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase" as const,
                                color: "#C9A96E",
                                marginBottom: "14px",
                            }}>
                                행사 주최자
                            </span>

                            {/* 제목 */}
                            <h2 style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontWeight: 900,
                                fontSize: "clamp(22px, 3.5vw, 34px)",
                                color: "#FFFFFF",
                                letterSpacing: "-0.03em",
                                lineHeight: 1.25,
                                marginBottom: "16px",
                            }}>
                                행사를 등록하고<br />
                                <span style={{ color: "#C9A96E" }}>더 많은 신자와</span> 만나세요
                            </h2>

                            {/* 설명 */}
                            <p style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "14px",
                                color: "rgba(255,255,255,0.65)",
                                fontWeight: 300,
                                lineHeight: 1.9,
                                marginBottom: "32px",
                                flexGrow: 1,
                            }}>
                                피정, 미사, 강의, 순례 등 교회 행사를 등록하면<br />
                                전국 신자들에게 소개됩니다.<br />
                                무료로 시작할 수 있습니다.
                            </p>

                            {/* 기능 목록 */}
                            <ul style={{
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: "8px",
                                marginBottom: "32px",
                            }}>
                                {["무료 행사 등록", "전국 신자 노출", "행사 정보 수정·삭제"].map(item => (
                                    <li key={item} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        color: "rgba(255,255,255,0.7)",
                                        fontWeight: 300,
                                    }}>
                                        <span style={{ color: "#C9A96E", fontSize: "16px", lineHeight: 1 }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            {/* 버튼 */}
                            <button
                                onClick={() => router.push("/register-event")}
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "8px",
                                    padding: "15px 28px",
                                    backgroundColor: "#C9A96E",
                                    color: "#0B2040",
                                    borderRadius: "10px",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 700,
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "background 0.2s, transform 0.15s",
                                    letterSpacing: "0.02em",
                                    alignSelf: "flex-start" as const,
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.backgroundColor = "#b8944f";
                                    el.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.backgroundColor = "#C9A96E";
                                    el.style.transform = "translateY(0)";
                                }}
                            >
                                <PlusCircle size={15} />
                                행사 등록하기
                            </button>
                        </motion.div>

                        {/* ── 카드 2: 로그인 / 회원가입 ───────────────── */}
                        <motion.div
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.55, delay: 0.12 }}
                            style={{
                                backgroundColor: "#FFFFFF",
                                borderRadius: "20px",
                                border: "1.5px solid #E8E5DF",
                                padding: "clamp(32px, 5vw, 52px)",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: "0px",
                            }}
                        >
                            {/* 아이콘 */}
                            <div style={{
                                width: "52px", height: "52px",
                                borderRadius: "14px",
                                backgroundColor: "rgba(11,32,64,0.07)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                marginBottom: "28px",
                                color: "#0B2040",
                            }}>
                                <LogIn size={24} />
                            </div>

                            {/* 배지 */}
                            <span style={{
                                display: "inline-block",
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px",
                                letterSpacing: "0.18em",
                                textTransform: "uppercase" as const,
                                color: "#9C9891",
                                marginBottom: "14px",
                            }}>
                                Members
                            </span>

                            {/* 제목 */}
                            <h2 style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontWeight: 900,
                                fontSize: "clamp(22px, 3.5vw, 34px)",
                                color: "#100F0F",
                                letterSpacing: "-0.03em",
                                lineHeight: 1.25,
                                marginBottom: "16px",
                            }}>
                                로그인하고<br />
                                <span style={{ color: "#C9A96E" }}>더 많은 기능을</span> 사용하세요
                            </h2>

                            {/* 설명 */}
                            <p style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "14px",
                                color: "#52504B",
                                fontWeight: 300,
                                lineHeight: 1.9,
                                marginBottom: "32px",
                                flexGrow: 1,
                            }}>
                                즐겨찾기, 행사 알림, 맞춤 추천 등<br />
                                로그인 회원 전용 서비스를 이용하세요.
                            </p>

                            {/* 기능 목록 */}
                            <ul style={{
                                listStyle: "none",
                                display: "flex",
                                flexDirection: "column" as const,
                                gap: "8px",
                                marginBottom: "32px",
                            }}>
                                {["관심 행사 즐겨찾기", "행사 일정 알림", "맞춤 행사 추천"].map(item => (
                                    <li key={item} style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        color: "#52504B",
                                        fontWeight: 300,
                                    }}>
                                        <span style={{ color: "#C9A96E", fontSize: "16px", lineHeight: 1 }}>✓</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>

                            {/* 버튼 */}
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const }}>
                                <button
                                    onClick={() => router.push("/login")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "15px 28px",
                                        backgroundColor: "#0B2040",
                                        color: "#FFFFFF",
                                        borderRadius: "10px",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "14px",
                                        fontWeight: 600,
                                        border: "none",
                                        cursor: "pointer",
                                        transition: "background 0.2s, transform 0.15s",
                                        letterSpacing: "0.02em",
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.backgroundColor = "#183568";
                                        el.style.transform = "translateY(-2px)";
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.backgroundColor = "#0B2040";
                                        el.style.transform = "translateY(0)";
                                    }}
                                >
                                    로그인
                                    <ArrowRight size={15} />
                                </button>
                                <button
                                    onClick={() => router.push("/register")}
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "15px 28px",
                                        backgroundColor: "transparent",
                                        color: "#0B2040",
                                        borderRadius: "10px",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "14px",
                                        fontWeight: 500,
                                        border: "1.5px solid #D0CDC7",
                                        cursor: "pointer",
                                        transition: "border-color 0.2s, transform 0.15s",
                                        letterSpacing: "0.01em",
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.borderColor = "#0B2040";
                                        el.style.transform = "translateY(-2px)";
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.borderColor = "#D0CDC7";
                                        el.style.transform = "translateY(0)";
                                    }}
                                >
                                    회원가입
                                </button>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            <Footer />
            <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                events={events}
            />
        </div>
    );
}
