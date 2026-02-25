"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

// 밝고 아름다운 성당 내부 이미지
const HERO_IMAGE =
    "https://images.unsplash.com/photo-1548625149-720754f8b136?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=85&w=1200";

const HERO_IMAGE_FALLBACK =
    "https://images.pexels.com/photos/208216/pexels-photo-208216.jpeg?auto=compress&cs=tinysrgb&w=1200";

interface HeroProps {
    eventCount: number;
    onScrollDown: () => void;
}

const STAT_LABELS = [
    { key: "events", label: "예정 행사" },
    { key: "cats",   label: "카테고리",  value: "5" },
    { key: "free",   label: "무료 등록", value: "✓"  },
];

export function Hero({ eventCount, onScrollDown }: HeroProps) {
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgSrc, setImgSrc] = useState(HERO_IMAGE);

    return (
        <section
            style={{
                backgroundColor: "#FFFFFF",
                paddingTop: "60px",          // nav height
                minHeight: "clamp(560px, 88vh, 960px)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                position: "relative",
            }}
        >
            {/* ── subtle bg gradient ── */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse 60% 80% at 80% 50%, rgba(11,32,64,0.035) 0%, transparent 70%)," +
                        "radial-gradient(ellipse 40% 60% at 10% 80%, rgba(201,169,110,0.04) 0%, transparent 60%)",
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            <div
                className="sacred-rail"
                style={{
                    flex: 1,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "clamp(32px, 5vw, 80px)",
                    alignItems: "center",
                    paddingTop:    "clamp(48px, 5vw, 72px)",
                    paddingBottom: "clamp(48px, 5vw, 72px)",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* ══════════════════════════
                    LEFT — 텍스트 영역
                ══════════════════════════ */}
                <div>
                    {/* eyebrow label */}
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}
                    >
                        <div style={{ width: "28px", height: "1px", backgroundColor: "#C9A96E" }} />
                        <span
                            style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10.5px",
                                letterSpacing: "0.22em",
                                color: "#C9A96E",
                                textTransform: "uppercase",
                            }}
                        >
                            가톨릭 행사 정보 허브
                        </span>
                    </motion.div>

                    {/* headline — 3-line reveal */}
                    {["전국의", "가톨릭 행사를", "한곳에서."].map((line, i) => (
                        <div key={i} style={{ overflow: "hidden", lineHeight: 1 }}>
                            <motion.h1
                                initial={{ y: "110%" }}
                                animate={{ y: 0 }}
                                transition={{
                                    duration: 0.82,
                                    delay: 0.22 + i * 0.13,
                                    ease: [0.25, 0.46, 0.45, 0.94],
                                }}
                                style={{
                                    display: "block",
                                    fontFamily: "'Noto Serif KR', serif",
                                    fontSize: "clamp(42px, 6.5vw, 90px)",
                                    fontWeight: 900,
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1.12,
                                    color: i === 2 ? "#C9A96E" : "#0B2040",
                                    marginBottom: i < 2 ? "0.04em" : "0.32em",
                                }}
                            >
                                {line}
                            </motion.h1>
                        </div>
                    ))}

                    {/* subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.72 }}
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: "clamp(13.5px, 1.4vw, 15.5px)",
                            color: "#52504B",
                            fontWeight: 300,
                            lineHeight: 1.95,
                            maxWidth: "400px",
                            marginBottom: "36px",
                        }}
                    >
                        피정, 강의, 강론, 특강 — 흩어진 천주교<br />
                        행사 정보를 한 화면에서 탐색하세요.
                    </motion.p>

                    {/* CTA buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.88 }}
                        style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}
                    >
                        <button
                            onClick={onScrollDown}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "14px 28px",
                                backgroundColor: "#0B2040",
                                color: "#FFFFFF",
                                borderRadius: "10px",
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "14px",
                                fontWeight: 600,
                                border: "none",
                                cursor: "pointer",
                                transition: "background 0.2s, transform 0.15s",
                                letterSpacing: "0.01em",
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.backgroundColor = "#183568";
                                el.style.transform = "translateY(-1px)";
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
                            onClick={onScrollDown}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                padding: "14px 24px",
                                backgroundColor: "transparent",
                                color: "#52504B",
                                borderRadius: "10px",
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "14px",
                                fontWeight: 400,
                                border: "1.5px solid #E8E5DF",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                letterSpacing: "0.01em",
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.borderColor = "#0B2040";
                                el.style.color = "#0B2040";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.borderColor = "#E8E5DF";
                                el.style.color = "#52504B";
                            }}
                        >
                            행사 검색
                        </button>
                    </motion.div>

                    {/* stat pills */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1.1 }}
                        style={{
                            display: "flex",
                            gap: "24px",
                            marginTop: "44px",
                            paddingTop: "32px",
                            borderTop: "1px solid #E8E5DF",
                        }}
                    >
                        {[
                            { num: String(eventCount),  label: "예정 행사"  },
                            { num: "5",                  label: "카테고리"   },
                            { num: "무료",               label: "행사 등록"  },
                        ].map(({ num, label }) => (
                            <div key={label}>
                                <div
                                    style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "clamp(22px, 3vw, 36px)",
                                        fontWeight: 500,
                                        color: "#0B2040",
                                        lineHeight: 1,
                                    }}
                                >
                                    {num}
                                </div>
                                <div
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "11px",
                                        color: "#9C9891",
                                        marginTop: "5px",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* ══════════════════════════
                    RIGHT — 이미지 영역
                ══════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, x: 32, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{
                        position: "relative",
                        borderRadius: "20px",
                        overflow: "hidden",
                        aspectRatio: "4 / 5",
                        boxShadow: "0 32px 80px rgba(11,32,64,0.18), 0 8px 24px rgba(11,32,64,0.1)",
                    }}
                >
                    <img
                        src={imgSrc}
                        alt="가톨릭 성당"
                        onError={() => setImgSrc(HERO_IMAGE_FALLBACK)}
                        onLoad={() => setImgLoaded(true)}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            opacity: imgLoaded ? 1 : 0,
                            transition: "opacity 0.6s ease",
                        }}
                    />
                    {/* Gradient overlay - subtle bottom */}
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background:
                                "linear-gradient(to top, rgba(11,32,64,0.55) 0%, rgba(11,32,64,0.15) 45%, transparent 70%)",
                        }}
                    />
                    {/* Bottom label */}
                    <div
                        style={{
                            position: "absolute",
                            bottom: "20px",
                            left: "20px",
                            right: "20px",
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "rgba(255,255,255,0.9)",
                                letterSpacing: "0.08em",
                            }}
                        >
                            CATHOLICA
                        </span>
                        <span
                            style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px",
                                color: "rgba(201,169,110,0.8)",
                                letterSpacing: "0.15em",
                            }}
                        >
                            2026
                        </span>
                    </div>

                    {/* Gold top line accent */}
                    <div
                        style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            right: 0,
                            height: "3px",
                            background: "linear-gradient(to right, #C9A96E, transparent)",
                        }}
                    />
                </motion.div>
            </div>

            {/* ── Scroll hint ── */}
            <motion.button
                onClick={onScrollDown}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.7 }}
                style={{
                    position: "absolute",
                    bottom: "24px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    zIndex: 2,
                }}
            >
                <span
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "9px",
                        color: "#9C9891",
                        letterSpacing: "0.2em",
                        textTransform: "uppercase",
                    }}
                >
                    scroll
                </span>
                <motion.div
                    animate={{ y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                    <ChevronDown size={14} color="#9C9891" />
                </motion.div>
            </motion.button>
        </section>
    );
}
