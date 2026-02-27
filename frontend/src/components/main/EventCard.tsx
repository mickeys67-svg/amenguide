"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Calendar, ArrowUpRight, ExternalLink, Heart } from "lucide-react";
import Link from "next/link";
import { EventData, CATEGORY_COLORS, CATEGORY_IMAGES, RETREAT_IMG } from "../../types/event";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";

interface EventCardProps {
    event: EventData;
    index: number;
    variant?: "grid" | "list" | "featured";
    isBookmarked?: boolean;
    onBookmarkToggle?: (eventId: string, current: boolean) => void;
}

/** OG 이미지 lazy 스크래핑 훅
 *
 * 플리커 방지 전략:
 *   OG URL을 받은 뒤 곧바로 상태를 업데이트하지 않고,
 *   new Image()로 브라우저 캐시에 완전히 로드한 후에만 상태를 갱신한다.
 *   → src 교체 시점에 이미지가 이미 캐시에 있으므로 빈 화면(flash) 없이 즉시 표시.
 */
function useOgImage(originUrl?: string, fallback?: string): string {
    const [ogImage, setOgImage] = useState<string | null>(null);

    useEffect(() => {
        if (!originUrl) return;
        let cancelled = false;

        fetch(`/api/og-image?url=${encodeURIComponent(originUrl)}`)
            .then(r => r.json())
            .then(data => {
                if (cancelled || !data.image) return;
                // 실제 이미지를 미리 로드 → 캐시 완료 후 상태 업데이트
                const img = new window.Image();
                img.onload = () => { if (!cancelled) setOgImage(data.image); };
                img.onerror = () => { /* 실패 시 fallback 유지, 상태 변경 없음 */ };
                img.src = data.image;
            })
            .catch(() => {});

        return () => { cancelled = true; };
    }, [originUrl]);

    return ogImage || fallback || RETREAT_IMG;
}

export function EventCard({
    event, index, variant = "grid",
    isBookmarked = false,
    onBookmarkToggle,
}: EventCardProps) {
    const [hovered, setHovered] = useState(false);
    const [bookmarked, setBookmarked] = useState(isBookmarked);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const catColor = CATEGORY_COLORS[event.category] || "#0B2040";
    const fallbackImg = CATEGORY_IMAGES[event.category] || event.image || RETREAT_IMG;
    const cardImage = useOgImage(event.originUrl, fallbackImg);

    useEffect(() => { setBookmarked(isBookmarked); }, [isBookmarked]);
    useEffect(() => {
        try { setIsLoggedIn(!!localStorage.getItem("authToken")); } catch {}
    }, []);

    const handleBookmark = async (e: React.MouseEvent) => {
        e.preventDefault(); e.stopPropagation();
        const token = localStorage.getItem("authToken");
        if (!token) { window.location.href = "/login"; return; }
        const next = !bookmarked;
        setBookmarked(next); // 낙관적 UI
        try {
            await fetch(`${API_BASE}/auth/me/bookmarks/${event.id}`, {
                method: next ? "POST" : "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            onBookmarkToggle?.(String(event.id), !next);
        } catch { setBookmarked(!next); } // 실패 시 롤백
    };

    /* ────────────────────────────────
       Featured variant
    ──────────────────────────────── */
    if (variant === "featured") {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    style={{
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E8E5DF",
                        borderRadius: "16px",
                        overflow: "hidden",
                        cursor: "pointer",
                        boxShadow: hovered
                            ? "0 20px 56px rgba(11,32,64,0.14)"
                            : "0 2px 10px rgba(11,32,64,0.06)",
                        transform: hovered ? "translateY(-4px)" : "translateY(0)",
                        transition: "box-shadow 0.3s ease, transform 0.3s ease",
                    }}
                >
                    <div className="flex flex-col md:flex-row">
                        <div
                            style={{ width: "4px", flexShrink: 0, backgroundColor: catColor, minHeight: "200px" }}
                            className="hidden md:block"
                        />
                        <div style={{ padding: "clamp(28px, 4vw, 48px)", flex: 1 }}>
                            <div className="flex items-start justify-between gap-4 mb-5">
                                <span style={{
                                    display: "inline-block",
                                    padding: "4px 12px",
                                    borderRadius: "100px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    letterSpacing: "0.04em",
                                    backgroundColor: catColor + "12",
                                    color: catColor,
                                    border: `1px solid ${catColor}30`,
                                }}>
                                    추천 · {event.category}
                                </span>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891", flexShrink: 0 }}>
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>
                            <h2 style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "clamp(20px, 2.8vw, 32px)",
                                fontWeight: 700,
                                color: "#100F0F",
                                lineHeight: 1.35,
                                letterSpacing: "-0.02em",
                                marginBottom: "14px",
                            }}>
                                {event.title}
                            </h2>
                            {event.description && (
                                <p style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "#52504B",
                                    fontSize: "14px",
                                    lineHeight: 1.9,
                                    fontWeight: 300,
                                    marginBottom: "24px",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                } as React.CSSProperties}>
                                    {event.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-5">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={13} style={{ color: catColor }} />
                                        <span style={{ fontFamily: "'DM Mono', monospace", color: "#52504B", fontSize: "12px" }}>
                                            {event.date}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <MapPin size={13} style={{ color: catColor }} />
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "#52504B", fontSize: "12px" }}>
                                            {event.location}
                                        </span>
                                    </div>
                                </div>
                                <motion.div
                                    animate={{ x: hovered ? 0 : -4, opacity: hovered ? 1 : 0.5 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center gap-1.5"
                                    style={{ color: catColor }}
                                >
                                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500 }}>
                                        자세히 보기
                                    </span>
                                    <ArrowUpRight size={14} />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </motion.article>
            </Link>
        );
    }

    /* ────────────────────────────────
       List variant
    ──────────────────────────────── */
    if (variant === "list") {
        return (
            <Link href={`/events/${event.id}`}>
                <motion.article
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, delay: Math.min(index, 8) * 0.04 }}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    className="flex items-center gap-4 py-4 cursor-pointer"
                    style={{
                        borderBottom: "1px solid #E8E5DF",
                        transition: "background 0.15s ease",
                        borderRadius: "6px",
                        paddingLeft: "8px",
                        paddingRight: "8px",
                        backgroundColor: hovered ? "rgba(11,32,64,0.025)" : "transparent",
                    }}
                >
                    <span className="hidden md:block shrink-0" style={{
                        fontFamily: "'DM Mono', monospace",
                        color: "#D0CDC7",
                        fontSize: "11px",
                        width: "28px",
                        textAlign: "right",
                    }}>
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="shrink-0" style={{
                        width: "8px", height: "8px",
                        borderRadius: "50%",
                        backgroundColor: catColor,
                    }} />
                    <div className="flex-1 min-w-0">
                        <h3 style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: hovered ? "#0B2040" : "#100F0F",
                            fontSize: "15px",
                            fontWeight: hovered ? 600 : 500,
                            letterSpacing: "-0.01em",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            transition: "color 0.2s, font-weight 0.2s",
                        }}>
                            {event.title}
                        </h3>
                    </div>
                    <span className="hidden sm:inline-block shrink-0" style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "11px",
                        fontWeight: 500,
                        padding: "3px 10px",
                        borderRadius: "100px",
                        border: `1px solid ${catColor}30`,
                        color: catColor,
                    }}>
                        {event.category}
                    </span>
                    <span className="shrink-0 hidden xs:block" style={{
                        fontFamily: "'DM Mono', monospace",
                        color: "#9C9891",
                        fontSize: "12px",
                    }}>
                        {event.date}
                    </span>
                    <span className="shrink-0 hidden lg:block" style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        color: "#9C9891",
                        fontSize: "12px",
                    }}>
                        {event.location}
                    </span>
                    <motion.div
                        animate={{ x: hovered ? 0 : -4, opacity: hovered ? 1 : 0 }}
                        transition={{ duration: 0.15 }}
                        style={{ color: catColor }}
                    >
                        <ArrowUpRight size={14} />
                    </motion.div>
                </motion.article>
            </Link>
        );
    }

    /* ────────────────────────────────
       Grid variant (default)
    ──────────────────────────────── */
    return (
        <Link href={`/events/${event.id}`} style={{ display: "block", height: "100%" }}>
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: Math.min(index, 5) * 0.07 }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E5DF",
                    borderRadius: "16px",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    cursor: "pointer",
                    boxShadow: hovered
                        ? "0 20px 56px rgba(11,32,64,0.14)"
                        : "0 2px 10px rgba(11,32,64,0.05)",
                    transform: hovered ? "translateY(-5px)" : "translateY(0)",
                    transition: "box-shadow 0.3s ease, transform 0.3s ease",
                }}
            >
                {/* ── Image ── */}
                <div
                    style={{
                        height: "210px",
                        position: "relative",
                        overflow: "hidden",
                        flexShrink: 0,
                        backgroundColor: catColor + "18",
                    }}
                >
                    <img
                        src={cardImage}
                        alt={event.title}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            transform: hovered ? "scale(1.06)" : "scale(1)",
                            transition: "transform 0.55s ease",
                        }}
                        onError={e => {
                            (e.currentTarget as HTMLImageElement).src = fallbackImg;
                        }}
                    />
                    {/* Gradient */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(to bottom, rgba(0,0,0,0.04) 0%, rgba(0,0,0,0.52) 100%)",
                        }}
                    />
                    {/* Category badge */}
                    <span
                        style={{
                            position: "absolute",
                            bottom: "14px",
                            left: "14px",
                            display: "inline-block",
                            padding: "4px 11px",
                            borderRadius: "100px",
                            fontSize: "10.5px",
                            fontWeight: 600,
                            fontFamily: "'Noto Sans KR', sans-serif",
                            letterSpacing: "0.04em",
                            backgroundColor: catColor,
                            color: "#FFFFFF",
                        }}
                    >
                        {event.category}
                    </span>
                    {/* Index + 하트 버튼 */}
                    <div style={{
                        position: "absolute", top: "10px", right: "10px",
                        display: "flex", alignItems: "center", gap: "8px",
                    }}>
                        <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: "11px",
                            color: "rgba(255,255,255,0.55)",
                        }}>
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        {isLoggedIn && (
                            <button
                                onClick={handleBookmark}
                                title={bookmarked ? "즐겨찾기 해제" : "즐겨찾기 추가"}
                                style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    width: "30px", height: "30px", borderRadius: "50%",
                                    backgroundColor: bookmarked ? "rgba(201,169,110,0.9)" : "rgba(255,255,255,0.18)",
                                    border: "none", cursor: "pointer",
                                    backdropFilter: "blur(4px)",
                                    transition: "background 0.2s, transform 0.15s",
                                    color: bookmarked ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLButtonElement;
                                    el.style.transform = "scale(1.15)";
                                    if (!bookmarked) el.style.backgroundColor = "rgba(255,255,255,0.3)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLButtonElement;
                                    el.style.transform = "scale(1)";
                                    if (!bookmarked) el.style.backgroundColor = "rgba(255,255,255,0.18)";
                                }}
                            >
                                <Heart
                                    size={14}
                                    fill={bookmarked ? "currentColor" : "none"}
                                    strokeWidth={2}
                                />
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Card body ── */}
                <div
                    style={{
                        padding: "20px 20px 18px",
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                    }}
                >
                    {/* Title */}
                    <h3
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "#100F0F",
                            fontSize: "15.5px",
                            fontWeight: 700,
                            lineHeight: 1.55,
                            letterSpacing: "-0.01em",
                            marginBottom: "8px",
                        }}
                    >
                        {event.title}
                    </h3>

                    {/* Description */}
                    {event.description && (
                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "#52504B",
                                fontSize: "13px",
                                lineHeight: 1.85,
                                fontWeight: 300,
                                marginBottom: "16px",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            } as React.CSSProperties}
                        >
                            {event.description}
                        </p>
                    )}

                    <div style={{ flex: 1 }} />

                    {/* Meta */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            marginBottom: "16px",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <Calendar size={11} style={{ color: catColor, flexShrink: 0 }} />
                            <span style={{ fontFamily: "'DM Mono', monospace", color: "#52504B", fontSize: "12px" }}>
                                {event.date}
                            </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                            <MapPin size={11} style={{ color: catColor, flexShrink: 0 }} />
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "#52504B",
                                fontSize: "12px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}>
                                {event.location}
                            </span>
                        </div>
                    </div>

                    {/* Footer row — 원문링크 + 보기버튼만 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            gap: "8px",
                            paddingTop: "14px",
                            borderTop: "1px solid #F0EFE9",
                        }}
                    >
                        {event.originUrl && (
                            <a
                                href={event.originUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title="원문 보기"
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "7px",
                                    color: "#9C9891",
                                    border: "1px solid #E8E5DF",
                                    transition: "all 0.15s ease",
                                    flexShrink: 0,
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = catColor;
                                    el.style.borderColor = catColor + "50";
                                    el.style.backgroundColor = catColor + "08";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = "#9C9891";
                                    el.style.borderColor = "#E8E5DF";
                                    el.style.backgroundColor = "transparent";
                                }}
                            >
                                <ExternalLink size={11} />
                            </a>
                        )}

                        <motion.div
                            animate={{
                                x:       hovered ? 0 : -3,
                                opacity: hovered ? 1 : 0.3,
                            }}
                            transition={{ duration: 0.18 }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: catColor,
                            }}
                        >
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "12.5px",
                                fontWeight: 600,
                                letterSpacing: "0.02em",
                            }}>
                                자세히
                            </span>
                            <ArrowUpRight size={13} />
                        </motion.div>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
}
