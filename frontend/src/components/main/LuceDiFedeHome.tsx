"use client";

import { useState, useRef, useMemo, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { FilterBar } from "./FilterBar";
import { EventCard } from "./EventCard";
import { Footer } from "./Footer";
import { SearchModal } from "./SearchModal";
import { AiRecommendModal } from "./AiRecommendModal";
import { NoticeTicker } from "./NoticeTicker";
import CustomMap from "../map/CustomMap";
import { EventData, RETREAT_IMG } from "../../types/event";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import { DIOCESE_COORDS, type Diocese } from "../../constants/dioceses";
import { ArrowRight, MapPin, PlusCircle, LogIn, User, LogOut, ChevronDown } from "lucide-react";

/* ?? ?이?SVG (카테고리? ??????????????????????????????????????????????? */
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
    뉴스: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>
        </svg>
    ),
};

// ?? ??좌표 ?거리 계산 (km) ??Haversine formula ?????????????????????????
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
    { label: "뉴스", color: "#5C6B7A", desc: "교구 소식 · 인사 · 담화" },
];

// SSR에서 내려온 원시 이벤트 데이터를 EventData 형태로 변환
function mapRawEvents(data: any[]): EventData[] {
    const mapped = data.map((e) => ({
        id: String(e.id),
        title: e.title,
        subtitle: e.category || "",
        category: e.category || "피정",
        date: e.date ? new Date(e.date).toLocaleDateString("ko-KR") : "날짜 미정",
        rawDate: e.date || undefined,
        location: e.location || "장소 미정",
        description: e.aiSummary || "",
        aiSummary: e.aiSummary,
        image: RETREAT_IMG,
        latitude: e.latitude,
        longitude: e.longitude,
        originUrl: e.originUrl,
        createdAt: e.createdAt,
    }));
    const seen = new Set<string>();
    return mapped.filter(e => {
        const key = `${e.title}|${e.rawDate ?? 'nodate'}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export default function LuceDiFedeHome({ initialEvents = [], initialTotal, initialCategoryCounts }: { initialEvents?: any[]; initialTotal?: number; initialCategoryCounts?: Record<string, number> }) {
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState("전체");
    // carousel state removed — using horizontal chip strip
    const [sortBy, setSortBy] = useState("date");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchOpen, setSearchOpen] = useState(false);
    const [aiRecommendOpen, setAiRecommendOpen] = useState(false);
    const [selectedDiocese, setSelectedDiocese] = useState("");

    // 하이드레이션 후 localStorage에서 교구 복원
    useEffect(() => {
        const saved = localStorage.getItem("selectedDiocese");
        if (saved) setSelectedDiocese(saved);
    }, []);
    const [aboutOpen, setAboutOpen] = useState(false);
    const eventsRef = useRef<HTMLDivElement>(null);
    const [currentPage, setCurrentPage] = useState(1);

    // ── 로그인 상태 (useAuth 공유 훅) ──────────────────────────────
    const { authUser, logout: authLogout } = useAuth();

    // ── 정렬 에러 (교구 미선택 시 거리순 안내) ──────────────────
    const [sortError, setSortError] = useState<string | null>(null);

    const handleSortChange = (sort: string) => {
        if (sort === "distance" && !selectedDiocese) {
            setSortError("교구를 먼저 선택해주세요");
            return;
        }
        setSortBy(sort);
        if (sort !== "distance") setSortError(null);
    };

    // 교구 변경 핸들러: localStorage 저장 + 자동 거리순 전환
    const handleDioceseChange = useCallback((diocese: string) => {
        setSelectedDiocese(diocese);
        if (diocese) {
            localStorage.setItem("selectedDiocese", diocese);
            setSortBy("distance");   // ⭐ 교구 선택 → 자동 거리순
            setSortError(null);
        } else {
            localStorage.removeItem("selectedDiocese");
            if (sortBy === "distance") setSortBy("date"); // 전체 교구 → 날짜순 복귀
        }
    }, [sortBy]);

    // 교구 선택 시 sortError 자동 클리어
    useEffect(() => {
        if (sortError && selectedDiocese) setSortError(null);
    }, [selectedDiocese]);

    const [events, setEvents] = useState<EventData[]>(() => mapRawEvents(initialEvents));
    const [isLoading, setIsLoading] = useState(initialEvents.length === 0);
    const [error, setError] = useState<string | null>(null);

    // ?? 즐겨찾기 ?태 ????????????????????????????????????????????????????????
    const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://amenguide-backend-775250805671.us-west1.run.app";
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        fetch(`${API_BASE}/auth/me/bookmarked-ids`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
            .then(data => { if (data.ids) setBookmarkedIds(new Set(data.ids)); })
            .catch(() => {});
    }, [API_BASE]);

    const handleBookmarkToggle = (eventId: string, current: boolean) => {
        setBookmarkedIds(prev => {
            const next = new Set(prev);
            if (current) next.delete(eventId); else next.add(eventId);
            return next;
        });
    };

    // 서버사이드 페이지네이션 상태
    const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25, 30] as const;
    const [pageSize, setPageSize] = useState(15);
    const [totalPages, setTotalPages] = useState(() => Math.ceil((initialTotal ?? initialEvents.length) / pageSize) || 1);
    const [totalCount, setTotalCount] = useState(initialTotal ?? initialEvents.length);
    const [serverCategoryCounts, setServerCategoryCounts] = useState<Record<string, number>>(initialCategoryCounts ?? {});

    useEffect(() => {
        const abortController = new AbortController();
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // 거리순은 전체 데이터 필요 (클라이언트 정렬)
                const isDistanceSort = sortBy === "distance" && selectedDiocese;

                const params = new URLSearchParams();
                if (selectedDiocese) params.set("diocese", selectedDiocese);
                if (activeFilter !== "전체") params.set("category", activeFilter);
                if (!isDistanceSort) {
                    params.set("page", String(currentPage));
                    params.set("pageSize", String(pageSize));
                    if (sortBy === "latest") params.set("sort", "latest");
                }
                const endpoint = `/events${params.toString() ? `?${params}` : ""}`;
                const raw = await apiFetch<any>(endpoint, { signal: abortController.signal });

                if (isDistanceSort) {
                    // 거리순: 교구청 좌표 기준 클라이언트 정렬+페이지네이션
                    const dioceseCoord = DIOCESE_COORDS[selectedDiocese as Diocese];
                    if (!dioceseCoord) { setSortBy("date"); setIsLoading(false); return; }
                    const allEvents = Array.isArray(raw) ? raw : (raw.data ?? []);
                    const mapped = mapRawEvents(allEvents);
                    mapped.sort((a, b) => {
                        const hasA = a.latitude != null && a.longitude != null;
                        const hasB = b.latitude != null && b.longitude != null;
                        if (!hasA && !hasB) return 0;
                        if (!hasA) return 1;
                        if (!hasB) return -1;
                        const dA = haversineKm(dioceseCoord.lat, dioceseCoord.lng, a.latitude!, a.longitude!);
                        const dB = haversineKm(dioceseCoord.lat, dioceseCoord.lng, b.latitude!, b.longitude!);
                        return dA - dB;
                    });
                    setTotalCount(mapped.length);
                    setTotalPages(Math.ceil(mapped.length / pageSize));
                    setEvents(mapped.slice((currentPage - 1) * pageSize, currentPage * pageSize));
                    const cc: Record<string, number> = {};
                    for (const e of mapped) { cc[e.category] = (cc[e.category] || 0) + 1; }
                    setServerCategoryCounts(cc);
                } else if (raw && raw.data) {
                    // 페이지네이션 응답: { data, total, page, pageSize, categoryCounts }
                    setEvents(mapRawEvents(raw.data));
                    setTotalCount(raw.total);
                    setTotalPages(Math.ceil(raw.total / pageSize));
                    if (raw.categoryCounts) setServerCategoryCounts(raw.categoryCounts);
                } else if (Array.isArray(raw)) {
                    // 호환: 배열 응답 (fallback)
                    setEvents(mapRawEvents(raw));
                    setTotalCount(raw.length);
                    setTotalPages(Math.ceil(raw.length / pageSize));
                } else {
                    setEvents([]);
                    setTotalCount(0);
                    setTotalPages(1);
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name === 'AbortError') return;
                const msg = err instanceof Error ? err.message : "Failed to load events.";
                console.error("Fetch failed:", err);
                setError(msg);
            } finally {
                if (!abortController.signal.aborted) setIsLoading(false);
            }
        };
        fetchEvents();
        return () => abortController.abort();
    }, [selectedDiocese, activeFilter, sortBy, currentPage, pageSize]);

    // pagedEvents는 이제 events 자체가 서버에서 페이지네이션된 결과
    const pagedEvents = events;

    // 거리순일 때 각 이벤트의 교구 기준 거리(km) 계산
    const distanceMap = useMemo(() => {
        if (sortBy !== "distance" || !selectedDiocese) return null;
        const coord = DIOCESE_COORDS[selectedDiocese as Diocese];
        if (!coord) return null;
        const map = new Map<string, number>();
        for (const ev of pagedEvents) {
            if (ev.latitude != null && ev.longitude != null) {
                map.set(ev.id, haversineKm(coord.lat, coord.lng, ev.latitude, ev.longitude));
            }
        }
        return map;
    }, [pagedEvents, sortBy, selectedDiocese]);

    // 필터/정렬/페이지크기 변경 시 첫 페이지로 리셋
    useEffect(() => {
        setCurrentPage(1);
    }, [activeFilter, sortBy, selectedDiocese, pageSize]);

    // URL 해시(#events, #map)로 이동 시 해당 섹션으로 스크롤
    useEffect(() => {
        const hash = window.location.hash.replace("#", "");
        if (!hash) return;
        const timer = setTimeout(() => {
            const el = document.getElementById(hash);
            if (el) {
                const offset = hash === "events" ? 110 : 60;
                const y = el.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top: y, behavior: "smooth" });
            }
            // 해시 제거 (뒤로가기 시 재트리거 방지)
            window.history.replaceState(null, "", window.location.pathname);
        }, 300);
        return () => clearTimeout(timer);
    }, []);

    const countByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        CATEGORY_QUICK.forEach((c) => {
            map[c.label] = serverCategoryCounts[c.label] || 0;
        });
        return map;
    }, [serverCategoryCounts]);

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
                onAiRecommendOpen={() => setAiRecommendOpen(true)}
            />

            {/* ?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═
                HERO ??밝고 ?원???플??이?웃
            ?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═ */}
            <Hero eventCount={totalCount} onScrollDown={scrollToEvents} />

            {/* 공지사항 티커 — Hero와 카테고리 아이콘 사이 */}
            <NoticeTicker />

            {/* ?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═
                EVENTS SECTION
            ?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═?═ */}
            <section ref={eventsRef} id="events" style={{ backgroundColor: "#F8F7F4", paddingBottom: "96px" }}>

                {/* ?? 카테고리 ??????????????????????????????????????????? */}
                <div style={{ background: "linear-gradient(180deg, #F9F8F6 0%, #FFFFFF 100%)", borderBottom: "1px solid #E8E5DF" }}>
                    <div className="sacred-rail">
                        <style>{`
                            .cat-strip {
                                display: flex;
                                gap: 8px;
                                padding: 22px 0 18px;
                                overflow-x: auto;
                                scroll-snap-type: x proximity;
                                scroll-behavior: smooth;
                                scrollbar-width: none;
                                -webkit-overflow-scrolling: touch;
                            }
                            .cat-strip::-webkit-scrollbar { display: none; }
                            .cat-chip {
                                flex: 0 0 auto;
                                scroll-snap-align: start;
                                display: flex;
                                align-items: center;
                                gap: 10px;
                                padding: 10px 16px 10px 10px;
                                border-radius: 14px;
                                border: 1px solid rgba(0,0,0,0.06);
                                background: rgba(255,255,255,0.85);
                                backdrop-filter: blur(12px);
                                -webkit-backdrop-filter: blur(12px);
                                cursor: pointer;
                                transition: all 0.4s cubic-bezier(.22,1,.36,1);
                                white-space: nowrap;
                                position: relative;
                                box-shadow: 0 1px 3px rgba(0,0,0,0.03), 0 4px 12px rgba(0,0,0,0.02);
                            }
                            .cat-chip:hover {
                                transform: translateY(-3px);
                                box-shadow: 0 8px 28px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04);
                                border-color: rgba(0,0,0,0.1);
                            }
                            .cat-chip:active {
                                transform: scale(0.97) translateY(0);
                                transition-duration: 0.12s;
                            }
                            .cat-chip.on {
                                border-color: transparent;
                                transform: translateY(-2px);
                            }
                            .cat-chip-icon {
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                width: 36px; height: 36px;
                                border-radius: 10px;
                                transition: all 0.4s cubic-bezier(.22,1,.36,1);
                                flex-shrink: 0;
                            }
                            .cat-chip-text {
                                display: flex;
                                flex-direction: column;
                                gap: 3px;
                            }
                            .cat-chip-label {
                                font-family: 'Noto Sans KR', sans-serif;
                                font-weight: 700;
                                font-size: 13px;
                                letter-spacing: -0.02em;
                                line-height: 1;
                            }
                            .cat-chip-count {
                                font-family: 'DM Mono', monospace;
                                font-size: 11px;
                                font-weight: 500;
                                line-height: 1;
                                opacity: 0.6;
                                transition: opacity 0.3s ease;
                            }
                            .cat-chip.on .cat-chip-count {
                                opacity: 0.85;
                            }
                            @media (min-width: 820px) {
                                .cat-strip {
                                    justify-content: center;
                                    flex-wrap: wrap;
                                    overflow-x: visible;
                                    scroll-snap-type: none;
                                    gap: 10px;
                                }
                                .cat-chip {
                                    padding: 10px 20px 10px 12px;
                                }
                            }
                        `}</style>

                        <div className="cat-strip">
                            {CATEGORY_QUICK.map((cat) => {
                                const isActive = activeFilter === cat.label;
                                const count = countByCategory[cat.label] ?? 0;
                                /* 각 카테고리 컬러 기반 미세 조정 */
                                const lightBg = `${cat.color}0D`; /* 5% opacity */
                                const iconBg = isActive ? "rgba(255,255,255,0.22)" : `${cat.color}14`;
                                return (
                                    <button
                                        key={cat.label}
                                        type="button"
                                        className={`cat-chip${isActive ? " on" : ""}`}
                                        style={{
                                            background: isActive
                                                ? `linear-gradient(135deg, ${cat.color} 0%, ${cat.color}dd 100%)`
                                                : `linear-gradient(135deg, #FFFFFF 0%, ${lightBg} 100%)`,
                                            color: isActive ? "#FFFFFF" : "#2C2C2C",
                                            boxShadow: isActive
                                                ? `0 4px 20px ${cat.color}33, 0 8px 32px ${cat.color}1A, inset 0 1px 0 rgba(255,255,255,0.15)`
                                                : undefined,
                                        }}
                                        onClick={() => setActiveFilter(isActive ? "전체" : cat.label)}
                                    >
                                        <span
                                            className="cat-chip-icon"
                                            style={{
                                                background: iconBg,
                                                color: isActive ? "#FFFFFF" : cat.color,
                                            }}
                                        >
                                            {CATEGORY_ICONS[cat.label]}
                                        </span>
                                        <span className="cat-chip-text">
                                            <span className="cat-chip-label">{cat.label}</span>
                                            <span className="cat-chip-count" style={{ color: isActive ? "rgba(255,255,255,0.8)" : cat.color }}>
                                                {count}건
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ?체 보기 버튼 ??카테고리 ?택 ???시 */}
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
                            필터 제거 · 전체 보기
                        </button>
                    </div>
                )}

                <FilterBar
                    sortBy={sortBy}
                    onSortChange={handleSortChange}
                    totalCount={totalCount}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    sortError={sortError}
                    selectedDiocese={selectedDiocese}
                    onDioceseChange={handleDioceseChange}
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
                            fontSize: "clamp(22px, 2.5vw, 34px)",
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
                            {totalCount}건
                            {totalPages > 1 && (
                                <span style={{ marginLeft: "8px", color: "#C9A96E" }}>
                                    — {(currentPage - 1) * pageSize + 1}–{(currentPage - 1) * pageSize + pagedEvents.length} 표시 중
                                </span>
                            )}
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
                    ) : pagedEvents.length === 0 ? (
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
                                다른 카테고리를 선택해보세요
                            </p>
                        </motion.div>
                    ) : viewMode === "grid" ? (
                        <motion.div
                            key={`grid-${activeFilter}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.35 }}
                            className="event-card-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))",
                                gridAutoRows: "1fr",
                                gap: "20px",
                            }}
                        >
                            {pagedEvents.map((event, i) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    index={i}
                                    variant="grid"
                                    isBookmarked={bookmarkedIds.has(String(event.id))}
                                    onBookmarkToggle={handleBookmarkToggle}
                                    distanceKm={distanceMap?.get(event.id) ?? null}
                                />
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
                            {pagedEvents.map((event, i) => (
                                <EventCard
                                    key={event.id}
                                    event={event}
                                    index={i}
                                    variant="list"
                                    isBookmarked={bookmarkedIds.has(String(event.id))}
                                    onBookmarkToggle={handleBookmarkToggle}
                                    distanceKm={distanceMap?.get(event.id) ?? null}
                                />
                            ))}
                        </motion.div>
                    )}
                    {/* ── 페이지네이션 ── */}
                    {totalPages >= 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "16px",
                                padding: "52px 0 8px",
                            }}
                        >
                            {/* 페이지 번호 + 이전/다음 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <button
                                onClick={() => { setCurrentPage(p => p - 1); scrollToEvents(); }}
                                disabled={currentPage === 1}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "8px 18px",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: currentPage === 1 ? "#D0CDC7" : "#52504B",
                                    background: "none",
                                    border: "1.5px solid",
                                    borderColor: currentPage === 1 ? "#E8E5DF" : "#D0CDC7",
                                    borderRadius: "100px",
                                    cursor: currentPage === 1 ? "default" : "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                ← 이전
                            </button>

                            {/* 페이지 번호 */}
                            {(() => {
                                const pages: (number | "...")[] = [];
                                if (totalPages <= 7) {
                                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                                } else {
                                    pages.push(1);
                                    if (currentPage > 3) pages.push("...");
                                    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
                                    if (currentPage < totalPages - 2) pages.push("...");
                                    pages.push(totalPages);
                                }
                                return pages.map((p, idx) =>
                                    p === "..." ? (
                                        <span key={`ellipsis-${idx}`} style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "12px",
                                            color: "#9C9891",
                                            padding: "0 4px",
                                        }}>···</span>
                                    ) : (
                                        <button
                                            key={p}
                                            onClick={() => { setCurrentPage(p as number); scrollToEvents(); }}
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: "13px",
                                                fontWeight: currentPage === p ? 700 : 400,
                                                color: currentPage === p ? "#FFFFFF" : "#52504B",
                                                background: currentPage === p ? "#0B2040" : "transparent",
                                                border: "1.5px solid",
                                                borderColor: currentPage === p ? "#0B2040" : "#E8E5DF",
                                                borderRadius: "50%",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                            }}
                                        >
                                            {p}
                                        </button>
                                    )
                                );
                            })()}

                            {/* 다음 버튼 */}
                            <button
                                onClick={() => { setCurrentPage(p => p + 1); scrollToEvents(); }}
                                disabled={currentPage === totalPages}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "8px 18px",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 500,
                                    color: currentPage === totalPages ? "#D0CDC7" : "#FFFFFF",
                                    background: currentPage === totalPages ? "none" : "#0B2040",
                                    border: "1.5px solid",
                                    borderColor: currentPage === totalPages ? "#E8E5DF" : "#0B2040",
                                    borderRadius: "100px",
                                    cursor: currentPage === totalPages ? "default" : "pointer",
                                    transition: "all 0.15s",
                                }}
                            >
                                다음 →
                            </button>
                            </div>

                            {/* 페이지 크기 선택 */}
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "12px",
                                    color: "#9C9891",
                                }}>
                                    표시 건수
                                </span>
                                <div style={{ display: "flex", gap: "4px" }}>
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => setPageSize(size)}
                                            style={{
                                                padding: "5px 10px",
                                                fontFamily: "'DM Mono', monospace",
                                                fontSize: "12px",
                                                fontWeight: pageSize === size ? 700 : 400,
                                                color: pageSize === size ? "#FFFFFF" : "#52504B",
                                                background: pageSize === size ? "#0B2040" : "transparent",
                                                border: "1px solid",
                                                borderColor: pageSize === size ? "#0B2040" : "#E8E5DF",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                transition: "all 0.15s",
                                                minWidth: "36px",
                                            }}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* MAP SECTION */}
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
                            <CustomMap events={pagedEvents} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                가톨릭카 소개 SECTION (아코디언)
                ═══════════════════════════════════════ */}
            <section style={{ backgroundColor: "#FFFFFF", padding: "64px 0" }}>
                <div className="sacred-rail">
                    <div style={{ maxWidth: "780px", margin: "0 auto" }}>
                        {/* 접힌 헤더 — 클릭하면 펼침 */}
                        <button
                            onClick={() => setAboutOpen(!aboutOpen)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "16px",
                                width: "100%",
                                padding: "28px 32px",
                                backgroundColor: "transparent",
                                border: "1.5px solid #E8E5DF",
                                borderRadius: "16px",
                                cursor: "pointer",
                                transition: "all 0.25s ease",
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = "#C9A96E";
                                e.currentTarget.style.backgroundColor = "rgba(201,169,110,0.04)";
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = "#E8E5DF";
                                e.currentTarget.style.backgroundColor = "transparent";
                            }}
                        >
                            <div style={{ height: "1px", width: "28px", backgroundColor: "#C9A96E", flexShrink: 0 }} />
                            <div style={{ textAlign: "center" as const }}>
                                <span style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "10px",
                                    letterSpacing: "0.22em",
                                    textTransform: "uppercase" as const,
                                    color: "#C9A96E",
                                    display: "block",
                                    marginBottom: "8px",
                                }}>
                                    About Catholica
                                </span>
                                <span style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    fontWeight: 700,
                                    fontSize: "clamp(18px, 3vw, 24px)",
                                    color: "#100F0F",
                                    letterSpacing: "-0.02em",
                                }}>
                                    가톨릭카<span style={{ color: "#C9A96E" }}>,</span> 빛을 나누는 길
                                </span>
                            </div>
                            <motion.div
                                animate={{ rotate: aboutOpen ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                                style={{ flexShrink: 0, color: "#C9A96E" }}
                            >
                                <ChevronDown size={22} />
                            </motion.div>
                        </button>

                        {/* 펼쳐지는 본문 */}
                        <AnimatePresence initial={false}>
                            {aboutOpen && (
                                <motion.div
                                    key="about-content"
                                    initial={{ height: 0 }}
                                    animate={{ height: "auto" }}
                                    exit={{ height: 0 }}
                                    transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{
                                            opacity: { duration: 0.35, delay: 0.15 },
                                            y: { duration: 0.35, delay: 0.15 },
                                        }}
                                    >
                                    <div style={{ paddingTop: "48px" }}>

                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "15px",
                                            color: "#52504B",
                                            fontWeight: 300,
                                            lineHeight: 2.0,
                                            textAlign: "center" as const,
                                            marginBottom: "48px",
                                        }}>
                                            한국 가톨릭 신자들이 서로의 신앙 여정을 함께 걸어가도록 돕는 플랫폼입니다.
                                        </p>

                                        {/* 프란치스코 교황 성하 인용 1 */}
                                        <div style={{
                                            backgroundColor: "#F8F7F4",
                                            borderRadius: "16px",
                                            padding: "clamp(28px, 4vw, 44px)",
                                            marginBottom: "28px",
                                            borderLeft: "4px solid #C9A96E",
                                        }}>
                                            <p style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "clamp(15px, 2vw, 17px)",
                                                color: "#2A2520",
                                                fontWeight: 400,
                                                lineHeight: 2.0,
                                                fontStyle: "italic" as const,
                                                marginBottom: "20px",
                                            }}>
                                                &ldquo;사랑하는 젊은이들이여, 여러분은 교회의 &lsquo;지금&rsquo;입니다. 소파에 앉아 인생을 바라보지 마십시오. 주저하지 말고 위대한 일에 뛰어드십시오! 선과 아름다움과 진리를 향한 이상을 가꾸십시오.&rdquo;
                                            </p>
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "13px",
                                                color: "#C9A96E",
                                                fontWeight: 600,
                                                textAlign: "right" as const,
                                            }}>
                                                — 프란치스코 교황 성하, 후기 권고 &lt;그리스도는 살아 계십니다&gt; (Christus Vivit, 2019)
                                            </p>
                                        </div>

                                        {/* 프란치스코 교황 성하 인용 2 */}
                                        <div style={{
                                            backgroundColor: "#F8F7F4",
                                            borderRadius: "16px",
                                            padding: "clamp(28px, 4vw, 44px)",
                                            marginBottom: "48px",
                                            borderLeft: "4px solid #C9A96E",
                                        }}>
                                            <p style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "clamp(15px, 2vw, 17px)",
                                                color: "#2A2520",
                                                fontWeight: 400,
                                                lineHeight: 2.0,
                                                fontStyle: "italic" as const,
                                                marginBottom: "20px",
                                            }}>
                                                &ldquo;카를로 아쿠티스는 인터넷을 하느님께 이르는 길로 삼았습니다. 그는 디지털 세상이 감각의 마비나 고립의 도구가 아니라, 복음의 기쁨을 나누는 네트워크가 될 수 있음을 보여주었습니다.&rdquo;
                                            </p>
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "13px",
                                                color: "#C9A96E",
                                                fontWeight: 600,
                                                textAlign: "right" as const,
                                                marginBottom: "4px",
                                            }}>
                                                — 프란치스코 교황 성하 (교황 권고 &laquo;그리스도는 살아계십니다&raquo;의 메시지 중)
                                            </p>
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "12px",
                                                color: "#9C9891",
                                                fontWeight: 400,
                                                textAlign: "right" as const,
                                            }}>
                                                카를로 아쿠티스 시성식 (2025년 9월 7일, 레오 14세 교황 성하 주례)
                                            </p>
                                        </div>

                                        {/* 본문 */}
                                        <div style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "14.5px",
                                            color: "#3A3632",
                                            fontWeight: 300,
                                            lineHeight: 2.1,
                                            marginBottom: "48px",
                                        }}>
                                            <p style={{ marginBottom: "24px" }}>
                                                가톨릭카(Catholica)는 프란치스코 교황 성하의 가르침을 따라, 디지털 세상에서 신앙의 빛을 나누고자 시작되었습니다. 전국 각 교구의 피정, 미사, 강의, 성지순례, 봉사활동 등 모든 가톨릭 행사를 한곳에 모아 신자들이 쉽고 빠르게 신앙 활동에 참여할 수 있도록 돕습니다.
                                            </p>
                                            <p style={{ marginBottom: "24px" }}>
                                                우리의 수호성인 카를로 아쿠티스(Carlo Acutis, 1991-2006)는 열다섯 짧은 생애 동안 &ldquo;인터넷을 이용하여 하느님께 이르는 고속도로&rdquo;를 꿈꾸었습니다. 밀라노에서 태어나 어릴 때부터 성체 앞에서 기도하기를 좋아하던 카를로는, 첫영성체 이후 매일 미사에 참례하고 묵주기도를 바치며 가난한 이들을 도왔습니다. 그는 자신의 프로그래밍 재능으로 전 세계 성체기적을 기록한 웹사이트를 만들어 수많은 이들에게 신앙의 감동을 전했습니다.
                                            </p>
                                            <p style={{ marginBottom: "24px" }}>
                                                카를로는 말했습니다. <strong style={{ color: "#0B2040", fontWeight: 600 }}>&ldquo;성체는 천국으로 향하는 나의 고속도로입니다.&rdquo;</strong> 또한 그는 <strong style={{ color: "#0B2040", fontWeight: 600 }}>&ldquo;모든 사람은 독창적으로 태어났는데, 많은 이들이 복사본으로 죽어갑니다&rdquo;</strong><span style={{ fontSize: "13px", color: "#7A756E" }}>(남을 부러워하거나 흉내 내지 말고, 네가 가진 고유한 모습 그대로 하느님을 사랑하며 살라)</span>라는 말로, 각자가 하느님께서 주신 고유한 은사를 발견하고 살아가야 한다고 일깨워 주었습니다.
                                            </p>
                                            <p style={{ marginBottom: "24px" }}>
                                                2006년 백혈병으로 하느님 품에 안긴 카를로는, 2020년 시복되었고 2025년 9월 7일 레오 14세 교황 성하 주례로 시성되어 &lsquo;디지털 시대의 첫 성인&rsquo;이 되었습니다. 그의 삶은 기술과 신앙이 대립하는 것이 아니라, 기술이 복음 선포의 도구가 될 수 있음을 증명합니다.
                                            </p>
                                            <p style={{ marginBottom: "24px" }}>
                                                가톨릭카는 카를로 아쿠티스 성인의 정신을 이어받아, 한국 가톨릭 교회의 행사와 소식을 디지털로 연결합니다. AI 영적 동반자 &lsquo;세실리아&rsquo;를 통해 성경 말씀과 성가로 위로를 전하고, 전국 16개 교구의 다양한 신앙 활동을 한눈에 볼 수 있도록 합니다.
                                            </p>
                                        </div>

                                        {/* 가치 키워드 */}
                                        <div style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                            gap: "16px",
                                            marginBottom: "48px",
                                        }}>
                                            {[
                                                { title: "사도직 봉사", desc: "신자들의 자발적 봉사로 운영되며, 교회 행사 정보를 무료로 제공합니다." },
                                                { title: "신앙의 연결", desc: "전국 16개 교구를 하나로 잇고, 모든 신자가 함께 걸어가는 신앙 공동체를 지향합니다." },
                                                { title: "디지털 복음화", desc: "카를로 아쿠티스 성인처럼, 기술을 통해 복음의 기쁨을 더 많은 이에게 전합니다." },
                                            ].map((item) => (
                                                <div key={item.title} style={{
                                                    backgroundColor: "#F8F7F4",
                                                    borderRadius: "14px",
                                                    padding: "28px 24px",
                                                }}>
                                                    <h4 style={{
                                                        fontFamily: "'Noto Serif KR', serif",
                                                        fontWeight: 700,
                                                        fontSize: "16px",
                                                        color: "#0B2040",
                                                        marginBottom: "10px",
                                                    }}>
                                                        {item.title}
                                                    </h4>
                                                    <p style={{
                                                        fontFamily: "'Noto Sans KR', sans-serif",
                                                        fontSize: "13px",
                                                        color: "#52504B",
                                                        fontWeight: 300,
                                                        lineHeight: 1.85,
                                                    }}>
                                                        {item.desc}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* 마무리 */}
                                        <div style={{ textAlign: "center" as const, marginTop: "12px" }}>
                                            <p style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "clamp(14px, 1.8vw, 16px)",
                                                color: "#52504B",
                                                fontWeight: 400,
                                                lineHeight: 2.0,
                                                fontStyle: "italic" as const,
                                                marginBottom: "32px",
                                            }}>
                                                &ldquo;소파에 앉아 인생을 바라보지 마십시오.&rdquo;<br />
                                                가톨릭카와 함께, 신앙의 빛 속으로 걸어가세요.
                                            </p>

                                            {/* 서명 */}
                                            <div style={{
                                                display: "inline-block",
                                                borderTop: "1px solid #E8E5DF",
                                                paddingTop: "24px",
                                            }}>
                                                <p style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "13px",
                                                    color: "#7A756E",
                                                    fontWeight: 300,
                                                    lineHeight: 1.8,
                                                    marginBottom: "6px",
                                                }}>
                                                    2026년 3월 25일 주님 탄생 예고 대축일에
                                                </p>
                                                <p style={{
                                                    fontFamily: "'Noto Serif KR', serif",
                                                    fontSize: "15px",
                                                    color: "#C9A96E",
                                                    fontWeight: 600,
                                                    letterSpacing: "0.08em",
                                                }}>
                                                    세실리아, 마리아
                                                </p>
                                            </div>
                                        </div>

                                    </div>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                CTA SECTION 행사 등록 + 로그인
                ═══════════════════════════════════════ */}
            <style>{`
                .cta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
                @media (max-width: 720px) { .cta-grid { grid-template-columns: 1fr; } }
            `}</style>
            <section style={{ backgroundColor: "#F8F7F4", padding: "96px 0" }}>
                <div className="sacred-rail">

                    {/* ?션 eyebrow */}
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

                        {/* ?? 카드 1: ?사 ?록 ?????????????????????????? */}
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
                            {/* 배경 ?식 */}
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

                            {/* ?이?*/}
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

                            {/* 배? */}
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

                            {/* ?목 */}
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
                                <span style={{ color: "#C9A96E" }}>더 많은 신자를</span> 만나세요
                            </h2>

                            {/* ?명 */}
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
                                전국 신자들에게 알려집니다.<br />
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
                                        <span style={{ color: "#C9A96E", fontSize: "16px", lineHeight: 1 }}>•</span>
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

                        {/* ?? 카드 2: 로그??비로그인) / ?영(로그?? ??? */}
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
                            {authUser ? (
                                /* ?? 로그???태 ?? */
                                <>
                                    {/* ?이?*/}
                                    <div style={{
                                        width: "52px", height: "52px",
                                        borderRadius: "14px",
                                        backgroundColor: "#0B2040",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        marginBottom: "28px",
                                        color: "#C9A96E",
                                    }}>
                                        <User size={24} />
                                    </div>

                                    {/* 배? */}
                                    <span style={{
                                        display: "inline-block",
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "10px",
                                        letterSpacing: "0.18em",
                                        textTransform: "uppercase" as const,
                                        color: "#C9A96E",
                                        marginBottom: "14px",
                                    }}>
                                        Welcome Back
                                    </span>

                                    {/* ?목 */}
                                    <h2 style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        fontWeight: 900,
                                        fontSize: "clamp(22px, 3.5vw, 34px)",
                                        color: "#100F0F",
                                        letterSpacing: "-0.03em",
                                        lineHeight: 1.25,
                                        marginBottom: "16px",
                                    }}>
                                        {authUser.name}님,<br />
                                        <span style={{ color: "#C9A96E" }}>돌아오셨군요!</span>
                                    </h2>

                                    {/* ?명 */}
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "14px",
                                        color: "#52504B",
                                        fontWeight: 300,
                                        lineHeight: 1.9,
                                        marginBottom: "32px",
                                        flexGrow: 1,
                                    }}>
                                        전국 가톨릭 행사를 검색하고<br />
                                        관심 행사를 즐겨찾기 해보세요.
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
                                                <span style={{ color: "#C9A96E", fontSize: "16px", lineHeight: 1 }}>•</span>
                                                {item}
                                            </li>
                                        ))}
                                    </ul>

                                    {/* 버튼 */}
                                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" as const }}>
                                        <button
                                            onClick={() => {
                                                const el = document.getElementById("events");
                                                if (el) {
                                                    const y = el.getBoundingClientRect().top + window.scrollY - 110;
                                                    window.scrollTo({ top: y, behavior: "smooth" });
                                                }
                                            }}
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
                                            행사 둘러보기
                                            <ArrowRight size={15} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                authLogout();
                                                window.location.href = "/";
                                            }}
                                            style={{
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                padding: "15px 28px",
                                                backgroundColor: "transparent",
                                                color: "#9C9891",
                                                borderRadius: "10px",
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                border: "1.5px solid #E8E5DF",
                                                cursor: "pointer",
                                                transition: "border-color 0.2s, color 0.2s, transform 0.15s",
                                            }}
                                            onMouseEnter={e => {
                                                const el = e.currentTarget as HTMLElement;
                                                el.style.borderColor = "#DC2626";
                                                el.style.color = "#DC2626";
                                                el.style.transform = "translateY(-2px)";
                                            }}
                                            onMouseLeave={e => {
                                                const el = e.currentTarget as HTMLElement;
                                                el.style.borderColor = "#E8E5DF";
                                                el.style.color = "#9C9891";
                                                el.style.transform = "translateY(0)";
                                            }}
                                        >
                                            <LogOut size={14} />
                                            로그아웃
                                        </button>
                                    </div>
                                </>
                            ) : (
                                /* ?? 비로그인 ?태 ?? */
                                <>
                                    {/* ?이?*/}
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

                                    {/* 배? */}
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

                                    {/* ?목 */}
                                    <h2 style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        fontWeight: 900,
                                        fontSize: "clamp(22px, 3.5vw, 34px)",
                                        color: "#100F0F",
                                        letterSpacing: "-0.03em",
                                        lineHeight: 1.25,
                                        marginBottom: "16px",
                                    }}>
                                        로그인하면<br />
                                        <span style={{ color: "#C9A96E" }}>더 많은 기능을</span> 이용하세요
                                    </h2>

                                    {/* ?명 */}
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
                                        로그인 회원 전용 서비스를 이용하세요
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
                                                <span style={{ color: "#C9A96E", fontSize: "16px", lineHeight: 1 }}>•</span>
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
                                </>
                            )}
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
            <AiRecommendModal
                isOpen={aiRecommendOpen}
                onClose={() => setAiRecommendOpen(false)}
            />
        </div>
    );
}
