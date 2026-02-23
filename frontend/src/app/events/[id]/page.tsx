"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowLeft, Share2, Heart, ExternalLink } from "lucide-react";
import { Navigation } from "../../../components/main/Navigation";
import { Footer } from "../../../components/main/Footer";
import { EventData, RETREAT_IMG } from "../../../types/event";
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
                    category: data.category || "기타",
                    date: data.date ? new Date(data.date).toLocaleDateString("ko-KR") : "연중 상시",
                    location: data.location || "장소 미정",
                    organizer: "Luce di Fede",
                    description: data.aiSummary || "",
                    aiSummary: data.aiSummary,
                    image: RETREAT_IMG,
                    duration: "상세참조",
                    tags: [],
                    originUrl: data.originUrl,
                };
                setEvent(mapped);
            } catch (err) {
                console.error("Fetch failed", err);
            } finally {
                setIsLoading(false);
            }
        };
        if (id) fetchEvent();
    }, [id]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#080705" }}>
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="w-7 h-7 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full"
                />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#080705" }}>
                <p style={{ color: "#F5F0E8", fontFamily: "'Noto Serif KR', serif", fontSize: "20px" }}>
                    행사를 찾을 수 없습니다
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-6 py-2.5 text-[13px] font-semibold cursor-pointer"
                    style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: "#080705", minHeight: "100vh" }}>
            <Navigation activeFilter="전체" onFilterChange={() => {}} onSearchOpen={() => {}} />

            <main className="pt-20 md:pt-24 pb-20">
                <div className="max-w-screen-lg mx-auto px-6 md:px-10">

                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-1.5 mb-7 cursor-pointer transition-colors hover:text-[#F5F0E8]"
                        style={{
                            color: "rgba(245,240,232,0.35)",
                            fontSize: "12px",
                            fontFamily: "'Noto Sans KR', sans-serif",
                        }}
                    >
                        <ArrowLeft size={13} />
                        목록으로
                    </button>

                    {/* Category + Title */}
                    <div className="mb-5">
                        <span
                            className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-widest rounded-sm mb-3"
                            style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                        >
                            {event.category}
                        </span>
                        <h1
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#F5F0E8",
                                fontSize: "clamp(20px, 2.4vw, 32px)",
                                fontWeight: 900,
                                lineHeight: 1.25,
                                letterSpacing: "-0.02em",
                            }}
                        >
                            {event.title}
                        </h1>
                    </div>

                    {/* Meta bar */}
                    <div
                        className="flex flex-wrap items-center gap-5 pb-5 mb-8"
                        style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}
                    >
                        <div className="flex items-center gap-1.5">
                            <Calendar size={13} className="text-[#C9A96E]" />
                            <span style={{ fontSize: "13px", color: "rgba(245,240,232,0.55)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                                {event.date}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#C9A96E]" />
                            <span style={{ fontSize: "13px", color: "rgba(245,240,232,0.55)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                                {event.location}
                            </span>
                        </div>
                    </div>

                    {/* Main grid */}
                    <div className="grid lg:grid-cols-12 gap-8 lg:gap-10">

                        {/* LEFT — image + description + single CTA */}
                        <motion.div
                            className="lg:col-span-8"
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Article image — above text, 16:9 */}
                            <div
                                className="w-full overflow-hidden rounded-sm mb-6"
                                style={{ aspectRatio: "16 / 9" }}
                            >
                                <img
                                    src={event.image || RETREAT_IMG}
                                    alt={event.title}
                                    className="w-full h-full object-cover"
                                    style={{ filter: "brightness(0.78) saturate(0.65) contrast(1.05)" }}
                                />
                            </div>

                            {/* Description */}
                            <p
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.68)",
                                    fontSize: "14px",
                                    lineHeight: 1.9,
                                    fontWeight: 300,
                                }}
                            >
                                {event.aiSummary || event.description || "상세 설명이 등록되지 않았습니다."}
                            </p>

                            {/* Action row — heart + share only */}
                            <div className="flex items-center gap-2 mt-7">
                                <button
                                    type="button"
                                    className="p-2.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/40 transition-colors cursor-pointer"
                                >
                                    <Heart size={15} className="text-[rgba(245,240,232,0.35)]" />
                                </button>
                                <button
                                    type="button"
                                    className="p-2.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/40 transition-colors cursor-pointer"
                                >
                                    <Share2 size={15} className="text-[rgba(245,240,232,0.35)]" />
                                </button>
                            </div>
                        </motion.div>

                        {/* RIGHT — sticky info card + CTA */}
                        <motion.div
                            className="lg:col-span-4"
                            initial={{ opacity: 0, x: 12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                        >
                            <div className="sticky top-28 flex flex-col gap-3">
                                {/* Info card */}
                                <div
                                    className="p-5 rounded-sm"
                                    style={{
                                        border: "1px solid rgba(201,169,110,0.12)",
                                        backgroundColor: "#0D0C09",
                                    }}
                                >
                                    <p
                                        className="text-[10px] font-bold tracking-[0.16em] uppercase mb-4"
                                        style={{ color: "rgba(201,169,110,0.5)", fontFamily: "'Playfair Display', serif" }}
                                    >
                                        행사 정보
                                    </p>
                                    <ul className="space-y-4">
                                        <li className="flex items-start gap-2.5">
                                            <Calendar size={13} className="text-[#C9A96E] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.25)] tracking-wider mb-1 uppercase">날짜</p>
                                                <p className="text-[#F5F0E8] text-[13px] leading-snug">{event.date}</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <MapPin size={13} className="text-[#C9A96E] shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.25)] tracking-wider mb-1 uppercase">장소</p>
                                                <p className="text-[#F5F0E8] text-[13px] leading-snug">{event.location}</p>
                                            </div>
                                        </li>
                                        <li className="flex items-start gap-2.5">
                                            <span
                                                className="inline-block w-3 h-3 rounded-sm shrink-0 mt-0.5"
                                                style={{ backgroundColor: "#C9A96E" }}
                                            />
                                            <div>
                                                <p className="text-[10px] text-[rgba(245,240,232,0.25)] tracking-wider mb-1 uppercase">카테고리</p>
                                                <p className="text-[#F5F0E8] text-[13px]">{event.category}</p>
                                            </div>
                                        </li>
                                    </ul>
                                </div>

                                {/* Primary CTA */}
                                <button
                                    type="button"
                                    onClick={() => event.originUrl && window.open(event.originUrl, "_blank")}
                                    disabled={!event.originUrl}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 text-[12px] font-bold tracking-[0.08em] rounded-sm transition-opacity hover:opacity-85 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                    style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                                >
                                    원문 보기
                                    <ExternalLink size={13} />
                                </button>

                                {/* Notice */}
                                <p
                                    className="text-center text-[11px] leading-relaxed px-1"
                                    style={{ color: "rgba(245,240,232,0.2)", fontFamily: "'Noto Sans KR', sans-serif" }}
                                >
                                    원문 사이트에서 신청 및 상세 일정을<br />확인하실 수 있습니다.
                                </p>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
