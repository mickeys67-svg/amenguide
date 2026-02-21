"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { MarqueeBar } from "./MarqueeBar";
import { FilterBar } from "./FilterBar";
import { EventCard, EventData } from "./EventCard";
import { StatsSection } from "./StatsSection";
import { Footer } from "./Footer";
import { SearchModal } from "./SearchModal";
import CustomMap from "../map/CustomMap";
import StainedGlassShader from "../effects/StainedGlassShader";

// Reusing same images and data from source App.tsx for the redesign
const RETREAT_IMG = "https://images.unsplash.com/photo-1761048152614-c525d49f31ee?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25hc3RlcnklMjBzaWxlbnQlMjByZXRyZWF0JTIwbW91bnRhaW4lMjBuYXR1cmV8ZW58MXx8fHwxNzcxNTUxMDA3fDA&ixlib=rb-4.1.0&q=80&w=1080";
const SERMON_IMG = "https://images.unsplash.com/photo-1767360046299-4fe27d66fdd7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmllc3QlMjBnaXZpbmclMjBzZXJtb24lMjBjYXRoZWRyYWx8ZW58MXx8fHwxNzcxNTUxMDA4fDA&ixlib=rb-4.1.0&q=80&w=1080";
const LECTURE_IMG = "https://images.unsplash.com/photo-1764603059768-ffafbcf14592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWJsZSUyMHN0dWR5JTIwbGVjdHVyZSUyMHJlbGlnaW91cyUyMGNvbW11bml0eXxlbnwxfHx8fDE3NzE1NTEwMDh8MA&ixlib=rb-4.1.0&q=80&w=1080";
const CANDLE_IMG = "https://images.unsplash.com/photo-1765146567664-cf0c0d987da9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYW5kbGUlMjBwcmF5ZXIlMjBtZWRpdGF0aW9uJTIwc3Bpcml0dWFsfGVufDF8fHx8MTc3MTU1MTAxMXww&ixlib=rb-4.1.0&q=80&w=1080";
const CROSS_IMG = "https://images.unsplash.com/photo-1721603322512-5c2ab03af14c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcm9zcyUyMHN1bnJpc2UlMjBwZWFjZWZ1bCUyMHBpbGdyaW1hZ2V8ZW58MXx8fHwxNzcxNTUxMDExfDA&ixlib=rb-4.1.0&q=80&w=1080";
const CHURCH_IMG = "https://images.unsplash.com/photo-1762967027312-d39989e249b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRob2xpYyUyMGNodXJjaCUyMGludGVyaW9yJTIwZHJhbWF0aWMlMjBsaWdodxlbnwxfHx8fDE3NzE1NTEwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080";

const ALL_EVENTS: EventData[] = [
    {
        id: 1, title: "침묵 피정 — 거룩한 고요 안으로", subtitle: "3박 4일 묵언 피정",
        category: "피정", date: "2026.03.06", endDate: "2026.03.09",
        location: "성 베네딕도 피정의 집 (왜관)", organizer: "왜관 베네딕도 수도원",
        description: "거룩한 침묵 속에서 하느님의 음성에 귀 기울이는 3박 4일간의 묵언 피정입니다. 강의와 개인 면담, 성무일도 참여로 이루어집니다.",
        image: RETREAT_IMG, duration: "3박 4일", tags: ["묵언", "베네딕도", "침묵", "수도원"], featured: true,
    },
    {
        id: 2, title: "청년 복음화 피정 — 새 하늘 새 땅", subtitle: "청년을 위한 활동 피정",
        category: "피정", date: "2026.03.20", endDate: "2026.03.22",
        location: "성 골롬반 피정의 집 (갈매동)", organizer: "서울대교구 청년국",
        description: "20-35세 청년을 위한 활기찬 복음화 피정. 찬양과 경배, 나눔, 성체조배로 구성된 영적 쇄신의 시간입니다.",
        image: CROSS_IMG, duration: "2박 3일", tags: ["청년", "복음화", "찬양", "서울대교구"],
    },
    {
        id: 3, title: "부부 피정 — 사랑의 성사", subtitle: "부부를 위한 쇄신 피정",
        category: "피정", date: "2026.04.11", endDate: "2026.04.13",
        location: "성 요셉 피정의 집 (수원)", organizer: "수원교구 가정사목부",
        description: "결혼 성사의 은혜를 새롭게 하는 부부 피정. 혼인 성사의 신비와 가정 복음화에 대해 함께 묵상합니다.",
        image: CANDLE_IMG, duration: "2박 3일", tags: ["부부", "가정", "혼인성사", "수원교구"],
    },
    {
        id: 4, title: "사순 피정 — 광야의 40일", subtitle: "사순 시기 특별 피정",
        category: "피정", date: "2026.03.01", endDate: "2026.03.03",
        location: "가르멜 피정의 집 (부산)", organizer: "부산교구 영성센터",
        description: "사순 시기를 맞이하여 주님의 수난을 묵상하고 회개와 쇄신을 위한 특별 피정. 십자가의 길 기도와 고해성사 포함.",
        image: CHURCH_IMG, duration: "2박 3일", tags: ["사순", "수난", "회개", "부산교구"],
    },
    {
        id: 5, title: "제2차 바티칸 공의회 문헌 강독", subtitle: "현대 교회를 이해하는 핵심 열쇠",
        category: "강의", date: "2026.03.12",
        location: "가톨릭대학교 성신교정 (서울)", organizer: "한국 가톨릭 평신도 사도직 단체",
        description: "제2차 바티칸 공의회의 주요 문헌(교회헌장, 사목헌장, 전례헌장)을 함께 읽고 현대 교회에서의 의미를 탐구합니다.",
        image: LECTURE_IMG, duration: "매주 목요일 (10주)", tags: ["공의회", "문헌", "교의신학", "평신도"],
    },
    {
        id: 6, title: "성경 통독 강의 — 구약의 빛으로", subtitle: "창세기부터 말라키까지",
        category: "강의", date: "2026.03.07",
        location: "대전교구 교육관", organizer: "대전교구 성서사도직",
        description: "구약성경 전체를 8개월에 걸쳐 통독하는 강의. 역사서, 예언서, 지혜서의 구조와 신학적 의미를 체계적으로 배웁니다.",
        image: RETREAT_IMG, duration: "매주 토요일 (32주)", tags: ["성경", "구약", "통독", "대전교구"],
    },
    {
        id: 7, title: "전례와 성사 — 보이지 않는 은총", subtitle: "성사신학 입문 강의",
        category: "강의", date: "2026.04.02",
        location: "부산 YMCA 강당", organizer: "부산교구 전례위원회",
        description: "교회의 7가지 성사와 전례의 의미를 심층적으로 배우는 강의. 미사 전례의 구조와 각 성사의 신학적 배경을 학습합니다.",
        image: CHURCH_IMG, duration: "6주 집중 강의", tags: ["전례", "성사", "신학", "미사"],
    },
    {
        id: 8, title: "사순절 주일 강론 특별 시리즈", subtitle: "주님 수난을 묵상하는 여섯 주간",
        category: "강론", date: "2026.02.22",
        location: "명동대성당 (서울)", organizer: "서울대교구 명동성당",
        description: "사순절 주일마다 진행되는 특별 강론 시리즈. 예수님의 수난과 부활의 신비를 깊이 묵상하는 여섯 번의 강론입니다.",
        image: SERMON_IMG, duration: "매주 일요일 오전 11시", tags: ["사순절", "명동", "수난", "묵상"],
    },
    {
        id: 9, title: "사도 바오로 서간 강론", subtitle: "로마서에서 필레몬서까지",
        category: "강론", date: "2026.03.15",
        location: "인천가톨릭대학교 성당", organizer: "인천교구 사제단",
        description: "바오로 사도의 서간들을 중심으로 신약 교회의 신학과 영성을 탐구하는 연속 강론입니다.",
        image: CANDLE_IMG, duration: "매주 일요일 (12주)", tags: ["바오로", "서간", "신약", "인천교구"],
    },
    {
        id: 10, title: "AI 시대의 그리스도인 — 기술과 영성", subtitle: "현대 기술 문명과 가톨릭 윤리",
        category: "특강", date: "2026.03.28",
        location: "서강대학교 다산관 (서울)", organizer: "서강대학교 신학대학원",
        description: "인공지능과 디지털 기술이 급속도로 발전하는 시대에 그리스도인은 어떤 삶의 태도를 지녀야 하는지 함께 고민합니다.",
        image: CROSS_IMG, duration: "1일 특강", tags: ["AI", "윤리", "기술", "현대신학"],
    },
    {
        id: 11, title: "마더 데레사 영성 특강", subtitle: "가장 작은 이들 안에서 만나는 그리스도",
        category: "특강", date: "2026.04.18",
        location: "가톨릭회관 대강당 (광주)", organizer: "광주대교구 자선단체",
        description: "마더 데레사 성인의 삶과 영성을 통해 사랑과 섬김의 의미를 재발견하는 특강입니다. 봉사와 나눔의 실천 방안도 함께 논의합니다.",
        image: CANDLE_IMG, duration: "반일 특강", tags: ["데레사", "봉사", "사랑", "광주대교구"],
    },
    {
        id: 12, title: "성 베네딕도 피정의 집", subtitle: "왜관 수도원 부속 피정 시설",
        category: "피정의집", date: "연중 상시",
        location: "경북 칠곡군 왜관읍", organizer: "왜관 베네딕도 수도원",
        description: "낙동강변 아름다운 자연 속에 자리한 피정의 집. 최대 80인 수용 가능. 대강당, 소강당, 경당, 성체조배실 완비.",
        image: RETREAT_IMG, duration: "1박~8박", tags: ["베네딕도", "왜관", "자연", "대규모"],
    },
    {
        id: 13, title: "성 골롬반 선교회 피정의 집", subtitle: "갈매동 숲속의 피정 공간",
        category: "피정의집", date: "연중 상시",
        location: "경기도 남양주시 별내면", organizer: "골롬반 선교회",
        description: "수도권 접근이 편리한 숲속 피정 공간. 개인 피정 및 단체 피정 모두 가능. 독방 30개, 강당 2개, 야외 십자가의 길.",
        image: CROSS_IMG, duration: "1박~7박", tags: ["골롬반", "갈매동", "수도권", "숲속"],
    },
];

export default function LuceDiFedeHome() {
    const [activeFilter, setActiveFilter] = useState("전체");
    const [sortBy, setSortBy] = useState("latest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchOpen, setSearchOpen] = useState(false);
    const eventsRef = useRef<HTMLDivElement>(null);

    const [events, setEvents] = useState<EventData[]>([]);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://amenguide-backend-775250805671.us-west1.run.app'}/api/v1/events`);
                if (response.ok) {
                    const data = await response.json();
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
                }
            } catch (error) {
                console.error("Fetch failed, using mock data", error);
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
                    {viewMode === "grid" ? (
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

            {/* Search Modal */}
            <SearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                events={events}
            />
        </div>
    );
}
