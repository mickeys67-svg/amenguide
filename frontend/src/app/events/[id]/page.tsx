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
                    className="w-8 h-8 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full"
                />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: "#080705" }}>
                <p style={{ color: "#F5F0E8", fontFamily: "'Noto Serif KR', serif", fontSize: "24px" }}>
                    행사를 찾을 수 없습니다
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="px-10 py-3.5 text-[15px] font-semibold cursor-pointer"
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

            {/* ── 헤더 밴드 ── */}
            <div
                className="pt-20 md:pt-[72px]"
                style={{ backgroundColor: "#0A0906", borderBottom: "1px solid rgba(201,169,110,0.08)" }}
            >
                <div className="max-w-[1200px] mx-auto px-8 md:px-16 py-10">

                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2 mb-8 cursor-pointer transition-colors hover:text-[#F5F0E8]"
                        style={{ color: "rgba(245,240,232,0.4)", fontSize: "14px", fontFamily: "'Noto Sans KR', sans-serif" }}
                    >
                        <ArrowLeft size={16} />
                        목록으로 돌아가기
                    </button>

                    {/* Category + Title */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span
                            className="inline-block px-3.5 py-1 text-[12px] font-bold tracking-widest rounded-sm mb-5"
                            style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                        >
                            {event.category}
                        </span>
                        <h1
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#F5F0E8",
                                fontSize: "clamp(26px, 3vw, 44px)",
                                fontWeight: 900,
                                lineHeight: 1.35,
                                letterSpacing: "-0.02em",
                                maxWidth: "800px",
                            }}
                        >
                            {event.title}
                        </h1>
                    </motion.div>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-8 mt-6">
                        <div className="flex items-center gap-3">
                            <Calendar size={17} className="text-[#C9A96E]" />
                            <span style={{ fontSize: "16px", color: "rgba(245,240,232,0.6)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                                {event.date}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <MapPin size={17} className="text-[#C9A96E]" />
                            <span style={{ fontSize: "16px", color: "rgba(245,240,232,0.6)", fontFamily: "'Noto Sans KR', sans-serif" }}>
                                {event.location}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── 대표 이미지 — 뷰포트 전체 폭 ── */}
            <motion.div
                className="w-full overflow-hidden"
                style={{ maxHeight: "520px" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.1 }}
            >
                <img
                    src={event.image || RETREAT_IMG}
                    alt={event.title}
                    className="w-full object-cover"
                    style={{
                        height: "clamp(280px, 36vw, 520px)",
                        filter: "brightness(0.75) saturate(0.6) contrast(1.05)",
                    }}
                />
            </motion.div>

            {/* ── 본문 + 사이드바 ── */}
            <main className="max-w-[1200px] mx-auto px-8 md:px-16 py-14 pb-24">
                <div className="grid lg:grid-cols-[1fr_340px] gap-12 lg:gap-16">

                    {/* LEFT — 본문 */}
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "rgba(245,240,232,0.75)",
                                fontSize: "17px",
                                lineHeight: 2.1,
                                fontWeight: 300,
                            }}
                        >
                            {event.aiSummary || event.description || "상세 설명이 등록되지 않았습니다."}
                        </p>

                        {/* 모바일 전용 CTA */}
                        <div className="flex items-center gap-3 mt-10 lg:hidden">
                            <button
                                type="button"
                                onClick={() => event.originUrl && window.open(event.originUrl, "_blank")}
                                disabled={!event.originUrl}
                                className="flex items-center justify-center gap-2 flex-1 py-4 text-[16px] font-bold rounded-sm transition-opacity hover:opacity-85 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                            >
                                원문 보기 <ExternalLink size={16} />
                            </button>
                            <button type="button" className="p-4 border border-[rgba(245,240,232,0.12)] rounded-sm hover:border-[#C9A96E]/40 transition-colors cursor-pointer">
                                <Heart size={18} className="text-[rgba(245,240,232,0.4)]" />
                            </button>
                            <button type="button" className="p-4 border border-[rgba(245,240,232,0.12)] rounded-sm hover:border-[#C9A96E]/40 transition-colors cursor-pointer">
                                <Share2 size={18} className="text-[rgba(245,240,232,0.4)]" />
                            </button>
                        </div>
                    </motion.div>

                    {/* RIGHT — 스티키 사이드바 */}
                    <motion.div
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="hidden lg:block"
                    >
                        <div className="sticky top-28 flex flex-col gap-5">

                            {/* 행사 정보 카드 */}
                            <div
                                className="rounded-sm"
                                style={{
                                    border: "1px solid rgba(201,169,110,0.18)",
                                    backgroundColor: "#0D0C09",
                                }}
                            >
                                <div
                                    className="px-7 py-4"
                                    style={{ borderBottom: "1px solid rgba(201,169,110,0.1)" }}
                                >
                                    <p
                                        style={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: "rgba(201,169,110,0.7)",
                                            fontSize: "12px",
                                            letterSpacing: "0.2em",
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        행사 정보
                                    </p>
                                </div>

                                <ul className="px-7 py-6 space-y-6">
                                    <li className="flex items-start gap-4">
                                        <div
                                            className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
                                        >
                                            <Calendar size={16} className="text-[#C9A96E]" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Noto Sans KR', sans-serif" }}>날짜</p>
                                            <p style={{ fontSize: "16px", color: "#F5F0E8", lineHeight: 1.4, fontFamily: "'Noto Sans KR', sans-serif" }}>{event.date}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div
                                            className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
                                        >
                                            <MapPin size={16} className="text-[#C9A96E]" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Noto Sans KR', sans-serif" }}>장소</p>
                                            <p style={{ fontSize: "16px", color: "#F5F0E8", lineHeight: 1.5, fontFamily: "'Noto Sans KR', sans-serif" }}>{event.location}</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-4">
                                        <div
                                            className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0"
                                            style={{ backgroundColor: "rgba(201,169,110,0.1)" }}
                                        >
                                            <span className="w-3.5 h-3.5 rounded-sm" style={{ backgroundColor: "#C9A96E" }} />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: "11px", color: "rgba(245,240,232,0.3)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px", fontFamily: "'Noto Sans KR', sans-serif" }}>카테고리</p>
                                            <p style={{ fontSize: "16px", color: "#F5F0E8", fontFamily: "'Noto Sans KR', sans-serif" }}>{event.category}</p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* 원문 보기 CTA */}
                            <button
                                type="button"
                                onClick={() => event.originUrl && window.open(event.originUrl, "_blank")}
                                disabled={!event.originUrl}
                                className="w-full flex items-center justify-center gap-3 py-5 text-[16px] font-bold tracking-wide rounded-sm transition-opacity hover:opacity-85 cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                                style={{ backgroundColor: "#C9A96E", color: "#080705" }}
                            >
                                원문 보기
                                <ExternalLink size={16} />
                            </button>

                            {/* 저장 / 공유 */}
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-center gap-2.5 py-3.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/50 transition-colors cursor-pointer"
                                    style={{ color: "rgba(245,240,232,0.5)", fontSize: "14px", fontFamily: "'Noto Sans KR', sans-serif" }}
                                >
                                    <Heart size={16} />
                                    저장
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 flex items-center justify-center gap-2.5 py-3.5 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E]/50 transition-colors cursor-pointer"
                                    style={{ color: "rgba(245,240,232,0.5)", fontSize: "14px", fontFamily: "'Noto Sans KR', sans-serif" }}
                                >
                                    <Share2 size={16} />
                                    공유
                                </button>
                            </div>

                            {/* 안내 */}
                            <p
                                className="text-center text-[12px] leading-relaxed"
                                style={{ color: "rgba(245,240,232,0.2)", fontFamily: "'Noto Sans KR', sans-serif" }}
                            >
                                원문 사이트에서 신청 및<br />상세 일정을 확인하실 수 있습니다.
                            </p>
                        </div>
                    </motion.div>

                </div>
            </main>

            <Footer />
        </div>
    );
}
