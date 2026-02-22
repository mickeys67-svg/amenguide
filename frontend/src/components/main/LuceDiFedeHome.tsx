"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { MarqueeBar } from "./MarqueeBar";
import { FilterBar } from "./FilterBar";
import { EventCard } from "./EventCard";
import { StatsSection } from "./StatsSection";
import { Footer } from "./Footer";
import { SearchModal } from "./SearchModal";
import CustomMap from "../map/CustomMap";
import StainedGlassShader from "../effects/StainedGlassShader";
import { EventData, RETREAT_IMG } from "../../types/event";
import { apiFetch } from "../../utils/api";

export default function LuceDiFedeHome() {
    const [activeFilter, setActiveFilter] = useState("전체");
    const [sortBy, setSortBy] = useState("latest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchOpen, setSearchOpen] = useState(false);
    const eventsRef = useRef<HTMLDivElement>(null);

    const [events, setEvents] = useState<EventData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvents = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await apiFetch<any[]>('/events');
                if (data && data.length > 0) {
                    const mappedEvents: EventData[] = data.map((e: any) => ({
                        id: e.id,
                        title: e.title,
                        subtitle: e.category || "",
                        category: e.category || "피정",
                        date: e.date ? new Date(e.date).toLocaleDateString('ko-KR') : "연중 상시",
                        location: e.location || "장소미정",
                        organizer: "Luce di Fede",
                        description: e.aiSummary || "",
                        aiSummary: e.aiSummary,
                        image: RETREAT_IMG,
                        duration: "상세참조",
                        tags: [],
                        featured: false,
                        latitude: e.latitude,
                        longitude: e.longitude,
                        originUrl: e.originUrl
                    }));
                    setEvents(mappedEvents);
                }
            } catch (err: any) {
                console.error("Fetch failed:", err);
                setError(err.message || "Failed to load events.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const featuredEvent = events.find(e => e.featured) || events[0];

    const filteredEvents = useMemo(() => {
        let currentEvents = activeFilter === "전체"
            ? [...events]
            : events.filter((e) => e.category === activeFilter);

        // Apply sorting
        if (sortBy === "latest") {
            currentEvents.sort((a, b) => {
                const idA = String(a.id);
                const idB = String(b.id);
                return idB.localeCompare(idA);
            });
        } else if (sortBy === "date") {
            currentEvents.sort((a, b) => {
                if (a.date === "연중 상시") return 1;
                if (b.date === "연중 상시") return -1;
                return a.date.localeCompare(b.date);
            });
        } else if (sortBy === "region") {
            currentEvents.sort((a, b) => (a.location || "").localeCompare(b.location || ""));
        }

        return currentEvents;
    }, [activeFilter, sortBy, events]);

    const handleScrollDown = () => {
        eventsRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div style={{ backgroundColor: "#080705", minHeight: "100vh" }}>
            <StainedGlassShader />
            <Navigation
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
                onSearchOpen={() => setSearchOpen(true)}
            />

            <Hero eventCount={events.length} onScrollDown={handleScrollDown} />

            <MarqueeBar />

            {/* Featured Event Section - The Sacred Chasm */}
            {featuredEvent && (
                <section className="py-40 md:py-64 relative border-b border-white/[0.03]" style={{ backgroundColor: "#080705" }}>
                    <div className="sacred-rail">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1, ease: [0.25, 0.46, 0.45, 0.94] }}
                            className="flex flex-col gap-6 mb-20"
                        >
                            <div className="flex items-center gap-6">
                                <div className="h-px w-20" style={{ backgroundColor: "#C9A96E", opacity: 0.6 }} />
                                <span
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: "#C9A96E",
                                        fontSize: "13px",
                                        letterSpacing: "0.4em",
                                        textTransform: "uppercase",
                                        opacity: 0.8
                                    }}
                                >
                                    이달의 추천 행사
                                </span>
                            </div>
                            <h2 className="text-[10px] tracking-[0.6em] text-white/20 uppercase pl-24">RECOMMENDED CURATION</h2>
                        </motion.div>

                        <div className="relative">
                            <EventCard event={featuredEvent} index={0} variant="featured" />
                        </div>
                    </div>
                </section>
            )}


            {/* Stats Section */}
            <StatsSection />

            {/* Events section */}
            <section
                ref={eventsRef}
                className="pb-24"
                style={{ backgroundColor: "#080705" }}
            >
                <FilterBar
                    activeFilter={activeFilter}
                    onFilterChange={setActiveFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    totalCount={filteredEvents.length}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                <div className="sacred-rail mt-32">
                    {/* Section title */}
                    <motion.div
                        key={activeFilter}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="mb-12"
                    >
                        <h2
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#F5F0E8",
                                fontSize: "clamp(28px, 4vw, 52px)",
                                fontWeight: 900,
                                letterSpacing: "-0.03em",
                                lineHeight: 1.1,
                            }}
                        >
                            {activeFilter === "전체" ? (
                                <>
                                    모든 행사<span style={{ color: "#C9A96E" }}>.</span>
                                </>
                            ) : (
                                <>
                                    {activeFilter}<span style={{ color: "#C9A96E" }}>.</span>
                                </>
                            )}
                        </h2>
                        <p
                            className="mt-8 text-[rgba(245,240,232,0.35)] text-[13px] font-light"
                        >
                            총 {filteredEvents.length}개의 행사
                        </p>
                    </motion.div>

                    {/* Events */}
                    {isLoading ? (
                        <div className="flex justify-center py-32">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                className="w-10 h-10 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full"
                            />
                        </div>
                    ) : error ? (
                        <div className="text-center py-24 text-[rgba(245,240,232,0.4)]">
                            <p>{error}</p>
                            <button onClick={() => window.location.reload()} className="mt-4 text-[#C9A96E] border-b border-[#C9A96E]">다시 시도</button>
                        </div>
                    ) : viewMode === "grid" ? (
                        <motion.div
                            key={`grid-${activeFilter}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-16 md:gap-24"
                        >
                            {filteredEvents.map((event, i) => (
                                <div key={event.id}>
                                    <EventCard event={event} index={i} variant="grid" />
                                </div>
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={`list-${activeFilter}`}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.4 }}
                        >
                            {/* List header */}
                            <div
                                className="hidden md:grid gap-6 pb-3 mb-2 border-b border-[rgba(245,240,232,0.1)]"
                                style={{
                                    gridTemplateColumns: "40px 12px 1fr 80px 120px 100px 20px",
                                }}
                            >
                                {["NO.", "", "행사명", "카테고리", "날짜", "장소", ""].map((h, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: "rgba(201,169,110,0.4)",
                                            fontSize: "10px",
                                            letterSpacing: "0.15em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {h}
                                    </span>
                                ))}
                            </div>
                            {filteredEvents.map((event, i) => (
                                <EventCard key={event.id} event={event} index={i} variant="list" />
                            ))}
                        </motion.div>
                    )}

                    {filteredEvents.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-24"
                        >
                            <p
                                style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    color: "rgba(245,240,232,0.3)",
                                    fontSize: "24px",
                                    fontWeight: 600,
                                }}
                            >
                                등록된 행사가 없습니다
                            </p>
                            <p
                                className="mt-3 text-[rgba(245,240,232,0.2)] text-[14px]"
                            >
                                다른 카테고리를 선택해 보세요
                            </p>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Map Section */}
            <section className="py-48" style={{ backgroundColor: "#080705" }}>
                <div className="sacred-rail">
                    <div className="grid lg:grid-cols-12 gap-12 items-center">
                        <div className="lg:col-span-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className="flex items-center gap-4 mb-16"
                            >
                                <div className="h-px w-10" style={{ backgroundColor: "#C9A96E" }} />
                                <span
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: "#C9A96E",
                                        fontSize: "11px",
                                        letterSpacing: "0.25em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Map
                                </span>
                            </motion.div>
                            <h2
                                className="mb-6"
                                style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    color: "#F5F0E8",
                                    fontSize: "clamp(28px, 4vw, 42px)",
                                    fontWeight: 900,
                                    letterSpacing: "-0.02em",
                                    lineHeight: 1.2,
                                }}
                            >
                                가까운 곳의<br />
                                <span style={{ color: "#C9A96E" }}>은총</span>을 찾아보세요
                            </h2>
                            <p
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.35)",
                                    fontSize: "15px",
                                    lineHeight: 1.8,
                                    fontWeight: 300,
                                    marginBottom: "80px",
                                }}
                            >
                                현재 위치를 중심으로 내 주변의 성지, 피정의 집, 그리고 진행 중인 기도 모임을 지도에서 한눈에 확인할 수 있습니다.
                            </p>
                            <motion.button
                                whileHover={{ x: 5 }}
                                className="flex items-center gap-2 group"
                                style={{ color: "#F5F0E8" }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "14px",
                                        borderBottom: "1px solid #C9A96E",
                                        paddingBottom: "2px",
                                    }}
                                >
                                    전체 지도 보기
                                </span>
                            </motion.button>
                        </div>
                        <div className="lg:col-span-8 rounded-lg overflow-hidden border border-[#C9A96E]/10 h-[500px]">
                            <CustomMap events={filteredEvents} />
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section
                className="py-32 md:py-48 relative overflow-hidden bg-[#C9A96E]"
            >
                <div className="sacred-rail relative z-10 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <p
                            className="mb-4 text-[rgba(8,7,5,0.5)] italic text-[14px] tracking-[0.15em]"
                            style={{
                                fontFamily: "'Playfair Display', serif",
                            }}
                        >
                            행사 주최자이신가요?
                        </p>
                        <h2
                            className="mb-8 text-[#080705] font-black tracking-[-0.04em] leading-[1.1]"
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "clamp(32px, 5vw, 72px)",
                            }}
                        >
                            행사를 등록하세요
                        </h2>
                        <p
                            className="mb-12 mx-auto text-[rgba(8,7,5,0.6)] text-[15px] leading-[1.8] max-w-[480px] font-light"
                        >
                            피정, 강의, 강론, 특강 등 가톨릭 관련 행사를 무료로 등록하고 더 많은 신자들에게 알리세요.
                        </p>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className="px-10 py-4 bg-[#080705] text-[#C9A96E] text-[14px] font-semibold tracking-[0.12em] uppercase"
                        >
                            행사 등록하기 →
                        </motion.button>
                    </motion.div>
                </div>

                {/* Decorative */}
                <div
                    className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden"
                >
                    <span
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: "clamp(140px, 22vw, 320px)",
                            fontWeight: 900,
                            color: "rgba(8,7,5,0.05)",
                            whiteSpace: "nowrap",
                            letterSpacing: "-0.06em",
                            lineHeight: 1,
                        }}
                    >
                        REGISTER
                    </span>
                </div>
            </section>

            <Footer />
            <div className="fixed bottom-2 right-2 text-[8px] text-[rgba(245,240,232,0.05)] pointer-events-none select-none">
                v1.2.1-f2b0aaf
            </div>
            <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                events={events}
            />
        </div>
    );
}
