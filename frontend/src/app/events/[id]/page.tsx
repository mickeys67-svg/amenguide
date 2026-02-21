"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Calendar, ArrowLeft, Share2, Heart, ExternalLink } from "lucide-react";
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
                const data = await apiFetch<any>(`/events/${id}`);
                const mapped: EventData = {
                    id: data.id,
                    title: data.title,
                    subtitle: data.category || "",
                    category: data.category || "피정",
                    date: data.date ? new Date(data.date).toLocaleDateString('ko-KR') : "연중 상시",
                    location: data.location || "장소미정",
                    organizer: "Luce di Fede",
                    description: data.aiSummary || "",
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
                    onClick={() => router.push("/")}
                    className="px-8 py-3 bg-[#C9A96E] text-[#080705] font-semibold rounded-sm"
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    const catColor = "#C9A96E"; // Default

    return (
        <div style={{ backgroundColor: "#080705", minHeight: "100vh" }}>
            <Navigation activeFilter="전체" onFilterChange={() => { }} onSearchOpen={() => { }} />

            <main className="pt-32 pb-24 px-6 md:px-12">
                <div className="max-w-screen-xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-[rgba(245,240,232,0.4)] mb-12 hover:text-[#F5F0E8] transition-colors"
                        style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px" }}
                    >
                        <ArrowLeft size={16} />
                        목록으로 돌아가기
                    </button>

                    <div className="grid lg:grid-cols-12 gap-16">
                        {/* Content Left */}
                        <div className="lg:col-span-7">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <span
                                        className="px-3 py-1 text-[11px] font-bold tracking-widest rounded-sm"
                                        style={{ backgroundColor: catColor, color: "#080705" }}
                                    >
                                        {event.category || "피정"}
                                    </span>
                                    <div className="h-px w-8 bg-[rgba(245,240,232,0.2)]" />
                                    <span className="text-[12px] text-[rgba(245,240,232,0.4)] tracking-widest uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        Event Details
                                    </span>
                                </div>

                                <h1
                                    className="mb-8"
                                    style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        color: "#F5F0E8",
                                        fontSize: "clamp(32px, 5vw, 56px)",
                                        fontWeight: 900,
                                        lineHeight: 1.1,
                                        letterSpacing: "-0.03em"
                                    }}
                                >
                                    {event.title}
                                </h1>

                                <div className="flex flex-wrap gap-8 mb-12 py-8 border-y border-[rgba(245,240,232,0.1)]">
                                    <div className="flex items-start gap-3">
                                        <Calendar size={18} className="text-[#C9A96E] mt-1" />
                                        <div>
                                            <p className="text-[11px] text-[rgba(245,240,232,0.3)] uppercase mb-1 tracking-wider">Date</p>
                                            <p className="text-[#F5F0E8] font-medium">{new Date(event.date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <MapPin size={18} className="text-[#C9A96E] mt-1" />
                                        <div>
                                            <p className="text-[11px] text-[rgba(245,240,232,0.3)] uppercase mb-1 tracking-wider">Location</p>
                                            <p className="text-[#F5F0E8] font-medium">{event.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Clock size={18} className="text-[#C9A96E] mt-1" />
                                        <div>
                                            <p className="text-[11px] text-[rgba(245,240,232,0.3)] uppercase mb-1 tracking-wider">Duration</p>
                                            <p className="text-[#F5F0E8] font-medium">상세 내용 확인</p>
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="prose prose-invert max-w-none mb-12"
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        color: "rgba(245,240,232,0.7)",
                                        lineHeight: 1.8,
                                        fontSize: "17px"
                                    }}
                                >
                                    <p className="mb-6">{event.aiSummary || event.description || "상세 설명이 등록되지 않았습니다."}</p>
                                    <div className="p-8 bg-[rgba(201,169,110,0.03)] border-l-2 border-[#C9A96E] my-10 italic">
                                        "그분께서 머무시는 곳을 보아라. 그분께서 너희를 부르신다."
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button className="flex items-center gap-2 px-8 py-4 bg-[#C9A96E] text-[#080705] font-bold rounded-sm hover:bg-[#D4B882] transition-colors">
                                        신청 사이트 바로가기
                                        <ExternalLink size={16} />
                                    </button>
                                    <button className="p-4 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E] transition-colors">
                                        <Heart size={20} className="text-[rgba(245,240,232,0.4)]" />
                                    </button>
                                    <button className="p-4 border border-[rgba(245,240,232,0.1)] rounded-sm hover:border-[#C9A96E] transition-colors">
                                        <Share2 size={20} className="text-[rgba(245,240,232,0.4)]" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>

                        {/* Sticky Sidebar Right */}
                        <div className="lg:col-span-5">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="sticky top-32"
                            >
                                <div className="rounded-lg overflow-hidden border border-[rgba(201,169,110,0.1)] group">
                                    <div className="relative aspect-[4/5] overflow-hidden">
                                        <motion.img
                                            layoutId={`event-image-${event.id}`}
                                            src={event.image || RETREAT_IMG}
                                            alt={event.title}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            style={{ filter: "brightness(0.7) contrast(1.1)" }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#080705] to-transparent opacity-60" />

                                        <div className="absolute bottom-8 left-8 right-8">
                                            <p className="text-[#C9A96E] text-[12px] font-bold tracking-[0.2em] uppercase mb-2">Organizer</p>
                                            <p className="text-[#F5F0E8] text-[20px] font-semibold" style={{ fontFamily: "'Noto Serif KR', serif" }}>
                                                {event.organizer || "Luce di Fede"}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-8 border border-[rgba(245,240,232,0.05)] rounded-sm bg-[linear-gradient(135deg,rgba(245,240,232,0.02)_0%,transparent_100%)]">
                                    <h4 className="text-[#C9A96E] text-[13px] font-bold tracking-widest uppercase mb-4">공동체 수칙</h4>
                                    <ul className="space-y-3 text-[14px] text-[rgba(245,240,232,0.4)] font-light leading-relaxed">
                                        <li>• 정숙한 분위기 유지를 부탁드립니다.</li>
                                        <li>• 행사 시작 10분 전까지 입실 완료해 주세요.</li>
                                        <li>• 취소 시 최소 3일 전까지 연락 부탁드립니다.</li>
                                    </ul>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
