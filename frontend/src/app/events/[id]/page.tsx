"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowLeft, Share2, Heart, ExternalLink } from "lucide-react";
import { Navigation } from "../../../components/main/Navigation";
import { Footer } from "../../../components/main/Footer";

import { EventData, RETREAT_IMG, CATEGORY_COLORS } from "../../../types/event";
import { apiFetch } from "../../../utils/api";

export default function EventDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [event, setEvent] = useState<EventData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const data = await apiFetch<EventData>(`/events/${id}`);
                const mapped: EventData = {
                    id: data.id,
                    title: data.title,
                    subtitle: data.category || "",
                    category: data.category || "피정",
                    date: data.date ? new Date(data.date).toLocaleDateString('ko-KR') : "연중 상시",
                    location: data.location || "장소미정",
                    organizer: "Luce di Fede",
                    description: data.aiSummary || "",
                    aiSummary: data.aiSummary,
                    image: RETREAT_IMG,
                    duration: "상세참조",
                    tags: [],
                    originUrl: data.originUrl
                };
                setEvent(mapped);
            } catch (error) {
                console.error("Fetch failed", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) fetchEvent();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#080705] flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full"
                />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-[#080705] flex flex-col items-center justify-center p-6 text-center">
                <h1 style={{ fontFamily: "'Noto Serif KR', serif", color: "#F5F0E8", fontSize: "32px", marginBottom: "16px" }}>행사를 찾을 수 없습니다</h1>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-8 py-3 bg-[#C9A96E] text-[#080705] font-semibold rounded-sm cursor-pointer"
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    const catColor = "#C9A96E";

    return (
        <div style={{ backgroundColor: "#080705", minHeight: "100vh" }}>
            <Navigation activeFilter="전체" onFilterChange={() => { }} onSearchOpen={() => { }} />

            {/* Hero - full-width wide image */}
            <div
                className="relative w-full overflow-hidden"
                style={{ height: "clamp(260px, 35vw, 420px)" }}
            >
                <img
                    src={event.image || RETREAT_IMG}
                    alt={event.title}
                    className="w-full h-full object-cover"
                    style={{ filter: "brightness(0.38) saturate(0.6) contrast(1.05)" }}
                />
                {/* gradient overlay */}
                <div
                    className="absolute inset-0"
                    style={{
                        background: "linear-gradient(to bottom, rgba(8,7,5,0.15) 0%, rgba(8,7,5,0.55) 60%, rgba(8,7,5,0.92) 100%)"
                    }}
                />

                {/* Hero content - bottom-left */}
                <div className="absolute bottom-0 left-0 right-0 px-6 md:px-16 pb-8 md:pb-10 max-w-screen-xl mx-auto">
                    {/* category badge */}
                    <span
                        className="inline-block px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase mb-3 rounded-sm"
                        style={{ backgroundColor: catColor, color: "#080705" }}
                    >
                        {event.category || "피정"}
                    </span>
                    <h1
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "#F5F0E8",
                            fontSize: "clamp(22px, 4vw, 44px)",
                            fontWeight: 900,
                            lineHeight: 1.15,
                            letterSpacing: "-0.03em",
                            maxWidth: "780px",
                        }}
                    >
                        {event.title}
                    </h1>
                </div>
            </div>

            {/* Main content */}
            <main className="pb-24">
                <div className="max-w-screen-xl mx-auto px-6 md:px-16">

                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mt-8 mb-8 text-[rgba(245,240,232,0.38)] hover:text-[#F5F0E8] transition-colors cursor-pointer"
                        style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px" }}
                    >
                        <ArrowLeft size={15} />
                        목록으로 돌아가기
                    </button>

                    {/* Two-column grid */}
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">

                        {/* LEFT — 8 cols */}
                        <motion.div
                            className="lg:col-span-8"
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.7 }}
                        >
                            {/* Meta bar */}
                            <div
                                className="flex flex-wrap gap-6 pb-6 mb-8"
                                style={{ borderBottom: "1px solid rgba(245,240,232,0.08)" }}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Calendar size={15} className="text-[#C9A96E] shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-[rgba(245,240,232,0.3)] uppercase tracking-wider mb-0.5">Date</p>
                                        <p className="text-[#F5F0E8] text-[14px] font-medium">{event.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                    <MapPin size={15} className="text-[#C9A96E] shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-[rgba(245,240,232,0.3)] uppercase tracking-wider mb-0.5">Location</p>
                                        <p className="text-[#F5F0E8] text-[14px] font-medium">{event.location}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.72)",
                                    lineHeight: 1.9,
                                    fontSize: "15px",
                                    fontWeight: 300,
                                }}
                            >
                                <p>{event.aiSummary || event.description || "상세 설명이 등록되지 않았습니다."}</p>
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    type="button"
                                    onClick={() => event.originUrl && window.open(event.originUrl, '_blank')}
                                    disabled={!event.originUrl}
                                    className="flex items-center gap-2 px-7 py-3.5 font-bold text-[13px] tracking-[0.06em] rounded-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                                    onMouseEnter={e => { if (event.originUrl) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4B882"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C9A96E"; }}
                                >
                                    원문 사이트 보러가기
                                    <ExternalLink size={14} />
                                </button>
                                <button
                                    type="button"
                                    className="p-3.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/50 transition-colors cursor-pointer"
                                >
                                    <Heart size={18} className="text-[rgba(245,240,232,0.38)]" />
                                </button>
                                <button
                                    type="button"
                                    className="p-3.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/50 transition-colors cursor-pointer"
                                >
                                    <Share2 size={18} className="text-[rgba(245,240,232,0.38)]" />
                                </button>
                            </div>
                        </motion.div>

                        {/* RIGHT — 4 cols, sticky */}
                        <motion.div
                            className="lg:col-span-4"
                            initial={{ opacity: 0, x: 16 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.7, delay: 0.15 }}
                        >
                            <div className="sticky top-24">
                                {/* Info card */}
                                <div
                                    className="p-5 rounded-sm"
                                    style={{
                                        border: "1px solid rgba(201,169,110,0.12)",
                                        backgroundColor: "#0D0C09",
                                    }}
                                >
                                    <h4
                                        className="text-[11px] font-bold tracking-[0.16em] uppercase mb-4"
                                        style={{ color: "rgba(201,169,110,0.6)", fontFamily: "'Playfair Display', serif" }}
                                    >
                                        행사 정보
                                    </h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <Calendar size={14} className="text-[#C9A96E] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.28)] uppercase tracking-wider mb-0.5">날짜</p>
                                                <p className="text-[#F5F0E8] text-[13px]">{event.date}</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <MapPin size={14} className="text-[#C9A96E] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.28)] uppercase tracking-wider mb-0.5">장소</p>
                                                <p className="text-[#F5F0E8] text-[13px]">{event.location}</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <span
                                                className="inline-block w-3.5 h-3.5 rounded-sm shrink-0 mt-0.5"
                                                style={{ backgroundColor: catColor }}
                                            />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.28)] uppercase tracking-wider mb-0.5">카테고리</p>
                                                <p className="text-[#F5F0E8] text-[13px]">{event.category}</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* CTA button */}
                                <button
                                    type="button"
                                    onClick={() => event.originUrl && window.open(event.originUrl, '_blank')}
                                    disabled={!event.originUrl}
                                    className="w-full mt-4 py-3.5 font-bold text-[13px] tracking-[0.08em] rounded-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                                    onMouseEnter={e => { if (event.originUrl) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#D4B882"; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#C9A96E"; }}
                                >
                                    원문 보기
                                    <ExternalLink size={14} />
                                </button>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
