"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowLeft, Share2, ExternalLink } from "lucide-react";
import { Navigation } from "../../../components/main/Navigation";
import { Footer } from "../../../components/main/Footer";
import { EventData, CATEGORY_COLORS, CATEGORY_IMAGES, RETREAT_IMG } from "../../../types/event";
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
                    organizer: "Catholica",
                    description: data.aiSummary || "",
                    aiSummary: data.aiSummary,
                    image: "",
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

    /* Loading */
    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "#F8F7F4",
                }}
            >
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "2px solid #E8E5DF",
                        borderTopColor: "#0B2040",
                    }}
                />
            </div>
        );
    }

    /* Not found */
    if (!event) {
        return (
            <div
                style={{
                    minHeight: "100vh",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "24px",
                    backgroundColor: "#F8F7F4",
                }}
            >
                <p
                    style={{
                        fontFamily: "'Noto Serif KR', serif",
                        color: "#100F0F",
                        fontSize: "24px",
                        fontWeight: 700,
                    }}
                >
                    행사를 찾을 수 없습니다
                </p>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    style={{
                        padding: "12px 32px",
                        backgroundColor: "#0B2040",
                        color: "#FFFFFF",
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "14px",
                        fontWeight: 500,
                        borderRadius: "8px",
                        cursor: "pointer",
                    }}
                >
                    홈으로 돌아가기
                </button>
            </div>
        );
    }

    const catColor = CATEGORY_COLORS[event.category] || "#0B2040";

    return (
        <div style={{ backgroundColor: "#F8F7F4", minHeight: "100vh" }}>
            <Navigation activeFilter="전체" onFilterChange={() => {}} onSearchOpen={() => {}} />

            {/* ── Hero header with image ── */}
            <div
                style={{
                    position: "relative",
                    height: "clamp(280px, 40vw, 420px)",
                    overflow: "hidden",
                    backgroundColor: "#080705",
                }}
            >
                {/* Background image */}
                <img
                    src={CATEGORY_IMAGES[event.category] || RETREAT_IMG}
                    alt={event.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.35 }}
                />
                {/* Gradient overlay */}
                <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        background:
                            "linear-gradient(to bottom, rgba(8,7,5,0.2) 0%, rgba(8,7,5,0.75) 70%, rgba(8,7,5,0.95) 100%)",
                    }}
                />
                {/* Gold rule */}
                <div
                    style={{
                        position: "absolute",
                        top: "60px",
                        left: 0,
                        right: 0,
                        height: "1px",
                        backgroundColor: "#C9A96E",
                        opacity: 0.4,
                    }}
                />
                {/* Content */}
                <div
                    className="sacred-rail"
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "flex-end",
                        paddingBottom: "40px",
                        paddingTop: "80px",
                    }}
                >
                    {/* Back button */}
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex items-center gap-2"
                        style={{
                            color: "rgba(245,240,232,0.5)",
                            fontSize: "13px",
                            fontFamily: "'Noto Sans KR', sans-serif",
                            marginBottom: "20px",
                            transition: "color 0.15s ease",
                            width: "fit-content",
                        }}
                        onMouseEnter={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = "#C9A96E")
                        }
                        onMouseLeave={(e) =>
                            ((e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)")
                        }
                    >
                        <ArrowLeft size={14} />
                        목록으로 돌아가기
                    </button>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {/* Category badge */}
                        <span
                            style={{
                                display: "inline-block",
                                padding: "4px 14px",
                                borderRadius: "100px",
                                fontSize: "11px",
                                fontWeight: 600,
                                fontFamily: "'Noto Sans KR', sans-serif",
                                letterSpacing: "0.04em",
                                backgroundColor: "rgba(201,169,110,0.15)",
                                color: "#C9A96E",
                                border: "1px solid rgba(201,169,110,0.4)",
                                marginBottom: "14px",
                            }}
                        >
                            {event.category}
                        </span>

                        {/* Title */}
                        <h1
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#F5F0E8",
                                fontSize: "clamp(22px, 3.2vw, 44px)",
                                fontWeight: 900,
                                lineHeight: 1.25,
                                letterSpacing: "-0.02em",
                                marginBottom: "18px",
                                maxWidth: "820px",
                            }}
                        >
                            {event.title}
                        </h1>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} style={{ color: "#C9A96E", flexShrink: 0 }} />
                                <span style={{ fontFamily: "'DM Mono', monospace", color: "rgba(245,240,232,0.65)", fontSize: "13px" }}>
                                    {event.date}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} style={{ color: "#C9A96E", flexShrink: 0 }} />
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "rgba(245,240,232,0.65)", fontSize: "13px" }}>
                                    {event.location}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* ── Content + Sidebar ── */}
            <main
                className="sacred-rail"
                style={{ paddingTop: "56px", paddingBottom: "96px" }}
            >
                <div className="grid lg:grid-cols-[1fr_300px] gap-12 lg:gap-16">

                    {/* Left — main body */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.1 }}
                    >
                        {/* Colored accent bar */}
                        <div
                            style={{
                                height: "3px",
                                width: "48px",
                                borderRadius: "2px",
                                backgroundColor: catColor,
                                marginBottom: "28px",
                            }}
                        />

                        {/* Description body */}
                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "#100F0F",
                                fontSize: "16px",
                                lineHeight: 2.1,
                                fontWeight: 300,
                                maxWidth: "66ch",
                            }}
                        >
                            {event.aiSummary || event.description || "상세 설명이 등록되지 않았습니다."}
                        </p>

                        {/* Mobile CTA */}
                        <div
                            className="flex items-center gap-3 mt-10 lg:hidden"
                        >
                            <button
                                type="button"
                                onClick={() => event.originUrl && window.open(event.originUrl, "_blank")}
                                disabled={!event.originUrl}
                                style={{
                                    flex: 1,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "14px",
                                    backgroundColor: "#0B2040",
                                    color: "#FFFFFF",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    borderRadius: "10px",
                                    cursor: event.originUrl ? "pointer" : "not-allowed",
                                    opacity: event.originUrl ? 1 : 0.35,
                                    transition: "background 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (event.originUrl)
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#183568";
                                }}
                                onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLElement).style.backgroundColor = "#0B2040")
                                }
                            >
                                원문 보기 <ExternalLink size={14} />
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: event.title, url: window.location.href });
                                    }
                                }}
                                style={{
                                    width: "48px",
                                    height: "48px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "10px",
                                    border: "1px solid #E8E5DF",
                                    color: "#52504B",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.borderColor = catColor;
                                    el.style.color = catColor;
                                }}
                                onMouseLeave={(e) => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.borderColor = "#E8E5DF";
                                    el.style.color = "#52504B";
                                }}
                            >
                                <Share2 size={16} />
                            </button>
                        </div>
                    </motion.div>

                    {/* Right — sticky sidebar */}
                    <motion.div
                        initial={{ opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                        className="hidden lg:block"
                    >
                        <div
                            style={{
                                position: "sticky",
                                top: "80px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            {/* Info card */}
                            <div
                                style={{
                                    backgroundColor: "#FFFFFF",
                                    border: "1px solid #E8E5DF",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                }}
                            >
                                {/* Card header */}
                                <div
                                    style={{
                                        padding: "14px 20px",
                                        borderBottom: "1px solid #E8E5DF",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "3px",
                                            height: "16px",
                                            borderRadius: "2px",
                                            backgroundColor: catColor,
                                        }}
                                    />
                                    <span
                                        style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "10px",
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: "#9C9891",
                                        }}
                                    >
                                        행사 정보
                                    </span>
                                </div>

                                <ul style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "18px" }}>
                                    {/* Date */}
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "8px",
                                                backgroundColor: catColor + "10",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Calendar size={14} style={{ color: catColor }} />
                                        </div>
                                        <div>
                                            <p
                                                style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "9px",
                                                    letterSpacing: "0.12em",
                                                    textTransform: "uppercase",
                                                    color: "#9C9891",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                날짜
                                            </p>
                                            <p
                                                style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "14px",
                                                    color: "#100F0F",
                                                    lineHeight: 1.4,
                                                }}
                                            >
                                                {event.date}
                                            </p>
                                        </div>
                                    </li>

                                    {/* Location */}
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "8px",
                                                backgroundColor: catColor + "10",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <MapPin size={14} style={{ color: catColor }} />
                                        </div>
                                        <div>
                                            <p
                                                style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "9px",
                                                    letterSpacing: "0.12em",
                                                    textTransform: "uppercase",
                                                    color: "#9C9891",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                장소
                                            </p>
                                            <p
                                                style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "14px",
                                                    color: "#100F0F",
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {event.location}
                                            </p>
                                        </div>
                                    </li>

                                    {/* Category */}
                                    <li style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                borderRadius: "8px",
                                                backgroundColor: catColor + "10",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}
                                        >
                                            <div
                                                style={{
                                                    width: "10px",
                                                    height: "10px",
                                                    borderRadius: "3px",
                                                    backgroundColor: catColor,
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <p
                                                style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "9px",
                                                    letterSpacing: "0.12em",
                                                    textTransform: "uppercase",
                                                    color: "#9C9891",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                카테고리
                                            </p>
                                            <p
                                                style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "14px",
                                                    color: catColor,
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {event.category}
                                            </p>
                                        </div>
                                    </li>
                                </ul>
                            </div>

                            {/* Primary CTA */}
                            <button
                                type="button"
                                onClick={() => event.originUrl && window.open(event.originUrl, "_blank")}
                                disabled={!event.originUrl}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "16px",
                                    backgroundColor: "#0B2040",
                                    color: "#FFFFFF",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                    borderRadius: "10px",
                                    letterSpacing: "0.02em",
                                    cursor: event.originUrl ? "pointer" : "not-allowed",
                                    opacity: event.originUrl ? 1 : 0.35,
                                    transition: "background 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (event.originUrl)
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#183568";
                                }}
                                onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLElement).style.backgroundColor = "#0B2040")
                                }
                            >
                                원문 보기
                                <ExternalLink size={14} />
                            </button>

                            {/* Share */}
                            <button
                                type="button"
                                onClick={() => {
                                    if (navigator.share) {
                                        navigator.share({ title: event.title, url: window.location.href });
                                    }
                                }}
                                style={{
                                    width: "100%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "8px",
                                    padding: "14px",
                                    backgroundColor: "transparent",
                                    color: "#52504B",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "13px",
                                    fontWeight: 400,
                                    borderRadius: "10px",
                                    border: "1px solid #E8E5DF",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.borderColor = catColor;
                                    el.style.color = catColor;
                                }}
                                onMouseLeave={(e) => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.borderColor = "#E8E5DF";
                                    el.style.color = "#52504B";
                                }}
                            >
                                <Share2 size={14} />
                                공유하기
                            </button>

                            <p
                                style={{
                                    textAlign: "center",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "#9C9891",
                                    fontSize: "11px",
                                    lineHeight: 1.7,
                                }}
                            >
                                원문 사이트에서 신청 및<br />
                                상세 일정을 확인하실 수 있습니다.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
