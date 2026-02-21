import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, ArrowUpRight, Calendar } from "lucide-react";
import Link from "next/link";

import { EventData, CATEGORY_COLORS } from "../../types/event";

interface EventCardProps {
    event: EventData;
    index: number;
    variant?: "grid" | "list" | "featured";
}

export function EventCard({ event, index, variant = "grid" }: EventCardProps) {
    const [hovered, setHovered] = useState(false);
    const catColor = CATEGORY_COLORS[event.category] || "#C9A96E";

    if (variant === "featured") {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.article
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="relative overflow-hidden cursor-pointer group rounded-lg"
                    style={{ backgroundColor: "#0F0E0B", border: "1px solid rgba(201,169,110,0.15)" }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    <div
                        className="flex flex-col md:flex-row items-stretch"
                        style={{ gap: "50px", backgroundColor: "#0F0E0B" }}
                    >
                        {/* Image Wrapper */}
                        <div className="flex-1 relative overflow-hidden" style={{ minHeight: "450px", minWidth: "40%" }}>
                            <motion.img
                                layoutId={`event-image-${event.id}`}
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover absolute inset-0"
                                style={{ filter: "brightness(0.6) saturate(0.8)" }}
                                animate={{ scale: hovered ? 1.05 : 1 }}
                                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                            />
                            {/* Category badge */}
                            <div className="absolute top-10 left-10">
                                <span
                                    className="px-5 py-2 text-[10px] uppercase tracking-[0.3em] rounded-sm"
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        backgroundColor: catColor,
                                        color: "#080705",
                                        fontWeight: 800,
                                    }}
                                >
                                    {event.category}
                                </span>
                            </div>
                        </div>

                        {/* Content Wrapper - The Sacred Library Text */}
                        <div
                            className="flex-1 flex flex-col justify-center py-16 md:py-32"
                            style={{ minWidth: "45%", paddingLeft: "50px", paddingRight: "50px" }}
                        >
                            <div className="max-w-[540px]">
                                <div className="flex items-center gap-3 mb-14">
                                    <div className="h-px w-16" style={{ backgroundColor: catColor }} />
                                    <span
                                        style={{
                                            fontFamily: "'Playfair Display', serif",
                                            color: catColor,
                                            fontSize: "13px",
                                            letterSpacing: "0.5em",
                                            fontWeight: 500
                                        }}
                                    >
                                        FEATURED
                                    </span>
                                </div>
                                <h2
                                    className="mb-12"
                                    style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        color: "#F5F0E8",
                                        fontSize: "clamp(32px, 5vw, 52px)",
                                        fontWeight: 800,
                                        lineHeight: 1.15,
                                        letterSpacing: "-0.05em",
                                    }}
                                >
                                    {event.title}
                                </h2>
                                <p
                                    className="mb-32"
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        color: "rgba(245,240,232,0.4)",
                                        fontSize: "17px",
                                        lineHeight: 2,
                                        fontWeight: 300,
                                    }}
                                >
                                    {event.description}
                                </p>

                            </div>

                            <div className="mt-12">
                                <div className="flex flex-col gap-8 mb-16">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={13} style={{ color: catColor }} />
                                        <span
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                color: "rgba(245,240,232,0.6)",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {event.date}{event.endDate ? ` ~ ${event.endDate}` : ""}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={13} style={{ color: catColor }} />
                                        <span
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                color: "rgba(245,240,232,0.6)",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {event.location}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock size={13} style={{ color: catColor }} />
                                        <span
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                color: "rgba(245,240,232,0.6)",
                                                fontSize: "13px",
                                            }}
                                        >
                                            {event.duration} · {event.organizer}
                                        </span>
                                    </div>
                                </div>

                                {event.originUrl && (
                                    <motion.a
                                        href={event.originUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        whileHover={{ x: 4 }}
                                        className="flex items-center gap-2 group/btn mb-8 w-fit"
                                        style={{ color: "#F5F0E8" }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "13px",
                                                letterSpacing: "0.1em",
                                                borderBottom: `1px solid ${catColor}`,
                                                paddingBottom: "2px",
                                            }}
                                        >
                                            원문 보기
                                        </span>
                                        <ArrowUpRight size={14} style={{ color: catColor }} />
                                    </motion.a>
                                )}

                                <motion.div
                                    whileHover={{ x: 4 }}
                                    className="flex items-center gap-2 group/btn"
                                    style={{ color: "#F5F0E8" }}
                                >
                                    <span
                                        style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "13px",
                                            letterSpacing: "0.1em",
                                            borderBottom: `1px solid ${catColor}`,
                                            paddingBottom: "2px",
                                        }}
                                    >
                                        자세히 보기
                                    </span>
                                    <ArrowUpRight size={14} style={{ color: catColor }} />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.article>
            </Link >
        );
    }

    if (variant === "list") {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.article
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: index * 0.07, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="flex items-center gap-6 py-6 cursor-pointer group relative"
                    style={{ borderBottom: "1px solid rgba(245,240,232,0.07)" }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                >
                    {/* Index number */}
                    <span
                        className="hidden md:block shrink-0 w-8 text-right"
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "rgba(201,169,110,0.3)",
                            fontSize: "12px",
                        }}
                    >
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* Category dot */}
                    <div
                        className="shrink-0 w-2 h-2 rounded-full"
                        style={{ backgroundColor: catColor }}
                    />

                    {/* Title */}
                    <div className="flex-1 min-w-0">
                        <h3
                            className="truncate"
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: hovered ? "#F5F0E8" : "rgba(245,240,232,0.8)",
                                fontSize: "16px",
                                fontWeight: 600,
                                letterSpacing: "-0.01em",
                                transition: "color 0.3s",
                            }}
                        >
                            {event.title}
                        </h3>
                        <p
                            className="hidden md:block truncate"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "rgba(245,240,232,0.35)",
                                fontSize: "12px",
                                marginTop: "2px",
                            }}
                        >
                            {event.organizer} {event.originUrl && "· 원문"}
                        </p>
                    </div>

                    {/* Category */}
                    <span
                        className="shrink-0 hidden md:block px-2 py-0.5 text-xs rounded-sm"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            border: `1px solid ${catColor}40`,
                            color: catColor,
                            fontSize: "11px",
                        }}
                    >
                        {event.category}
                    </span>

                    {/* Date */}
                    <span
                        className="shrink-0"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: "rgba(245,240,232,0.35)",
                            fontSize: "12px",
                        }}
                    >
                        {event.date}
                    </span>

                    {/* Location */}
                    <span
                        className="shrink-0 hidden lg:block"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: "rgba(245,240,232,0.35)",
                            fontSize: "12px",
                        }}
                    >
                        {event.location}
                    </span>

                    {/* Arrow */}
                    <motion.div
                        animate={{ x: hovered ? 0 : -4, opacity: hovered ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ArrowUpRight size={14} style={{ color: catColor }} />
                    </motion.div>
                </motion.article>
            </Link>
        );
    }

    // Grid variant (default)
    return (
        <Link href={`/events/${event.id}`}>
            <motion.article
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.7, delay: index * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative overflow-hidden cursor-pointer group flex flex-col h-full rounded-lg"
                style={{ backgroundColor: "#0F0E0B", border: "1px solid rgba(245,240,232,0.04)" }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {/* Image */}
                <div className="relative overflow-hidden" style={{ paddingBottom: "62%" }}>
                    <motion.img
                        layoutId={`event-image-${event.id}`}
                        src={event.image}
                        alt={event.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: "brightness(0.55) saturate(0.7)" }}
                        animate={{ scale: hovered ? 1.06 : 1 }}
                        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                    />
                    {/* Gradient overlay */}
                    <div
                        className="absolute inset-0"
                        style={{ background: "linear-gradient(to top, rgba(15,14,11,0.9) 0%, transparent 60%)" }}
                    />
                    {/* Category badge */}
                    <div className="absolute top-4 left-4">
                        <span
                            className="px-2 py-1 text-xs rounded-sm"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                backgroundColor: catColor,
                                color: "#080705",
                                fontWeight: 600,
                                fontSize: "10px",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {event.category}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div
                    className="flex flex-col flex-1"
                    style={{ padding: "20px" }}
                >
                    <h3
                        className="mb-12"
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "#F5F0E8",
                            fontSize: "19px",
                            fontWeight: 700,
                            letterSpacing: "-0.01em",
                            lineHeight: 1.4,
                        }}
                    >
                        {event.title}
                    </h3>
                    <p
                        className="mb-16 flex-1"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: "rgba(245,240,232,0.4)",
                            fontSize: "13px",
                            lineHeight: 1.8,
                            fontWeight: 300,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {event.description}
                    </p>

                    <div className="flex flex-col gap-4 mb-12">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={11} style={{ color: catColor, flexShrink: 0 }} />
                            <span
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.5)",
                                    fontSize: "12px",
                                }}
                            >
                                {event.date}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <MapPin size={11} style={{ color: catColor, flexShrink: 0 }} />
                            <span
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.5)",
                                    fontSize: "12px",
                                }}
                            >
                                {event.location}
                            </span>
                        </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-12" style={{ borderTop: "1px solid rgba(245,240,232,0.07)" }}>
                        <span
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "rgba(245,240,232,0.3)",
                                fontSize: "11px",
                            }}
                        >
                            {event.organizer}
                        </span>
                        <div className="flex items-center gap-3">
                            {event.originUrl && (
                                <a
                                    href={event.originUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1.5 hover:bg-white/5 rounded-full transition-colors"
                                    title="원문 보기"
                                >
                                    <ArrowUpRight size={12} style={{ color: catColor }} />
                                </a>
                            )}
                            <motion.div
                                animate={{ x: hovered ? 0 : -6, opacity: hovered ? 1 : 0.3 }}
                                transition={{ duration: 0.25 }}
                                className="flex items-center gap-1"
                                style={{ color: catColor }}
                            >
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px" }}>보기</span>
                                <ArrowUpRight size={12} />
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Hover border accent */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5"
                    style={{ backgroundColor: catColor, transformOrigin: "left" }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: hovered ? 1 : 0 }}
                    transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
            </motion.article>
        </Link>
    );
}
