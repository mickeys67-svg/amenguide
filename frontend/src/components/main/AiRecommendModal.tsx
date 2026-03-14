"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ArrowUpRight, Heart, Music } from "lucide-react";
import { EventData, CATEGORY_COLORS } from "../../types/event";
import { apiFetch } from "../../utils/api";
import Link from "next/link";

interface AiRecommendModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Recommendation {
    eventId: string;
    reason: string;
    event?: EventData;
}

interface AiResponse {
    message: string;
    hymn?: string;
    recommendations: { eventId: string; reason: string }[];
}

const EXAMPLE_PROMPTS = [
    "마음이 지치고 쉬고 싶어요",
    "신앙을 더 깊이 알고 싶어요",
    "같은 또래 친구들을 만나고 싶어요",
    "성지를 방문하고 싶어요",
    "고해성사를 보고 싶은데 용기가 안 나요",
    "기도하는 법을 배우고 싶어요",
];

export function AiRecommendModal({ isOpen, onClose }: AiRecommendModalProps) {
    const [feeling, setFeeling] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [aiMessage, setAiMessage] = useState("");
    const [hymn, setHymn] = useState("");
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [hasResult, setHasResult] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        } else {
            setFeeling("");
            setAiMessage("");
            setHymn("");
            setRecommendations([]);
            setHasResult(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const handleSubmit = async () => {
        const text = feeling.trim();
        if (text.length < 2 || isLoading) return;

        setIsLoading(true);
        setHasResult(false);
        try {
            // AI 추천 호출 — Claude API 경유하므로 30초 타임아웃
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";
            let data: AiResponse;
            try {
                const res = await fetch(`${API_BASE}/events/ai-recommend`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ feeling: text }),
                    signal: controller.signal,
                });
                if (!res.ok) throw new Error(`API Error: ${res.status}`);
                data = await res.json();
            } finally {
                clearTimeout(timeoutId);
            }

            setAiMessage(data.message);
            setHymn(data.hymn || "");

            // 추천된 행사 상세 정보를 병렬로 가져오기
            const recsWithEvents = await Promise.all(
                data.recommendations.map(async (rec) => {
                    try {
                        const event = await apiFetch<EventData>(`/events/${rec.eventId}`);
                        return {
                            ...rec,
                            event: {
                                ...event,
                                date: event.date ? new Date(event.date as string).toLocaleDateString("ko-KR") : "날짜 미정",
                                category: event.category || "피정",
                                location: event.location || "장소 미정",
                            },
                        } as Recommendation;
                    } catch {
                        return rec as Recommendation;
                    }
                })
            );

            setRecommendations(recsWithEvents);
            setHasResult(true);

            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        } catch (error) {
            setAiMessage("추천을 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.");
            setHasResult(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleExampleClick = (prompt: string) => {
        setFeeling(prompt);
        inputRef.current?.focus();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        style={{
                            position: "fixed", inset: 0, zIndex: 200,
                            backgroundColor: "rgba(11, 32, 64, 0.6)",
                            backdropFilter: "blur(8px)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        style={{
                            position: "fixed", inset: 0, zIndex: 201,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            padding: "20px",
                            pointerEvents: "none",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            style={{
                                width: "100%", maxWidth: "640px",
                                maxHeight: "85vh",
                                backgroundColor: "#FFFFFF",
                                borderRadius: "20px",
                                boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
                                overflow: "hidden",
                                display: "flex", flexDirection: "column",
                                pointerEvents: "auto",
                            }}
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {/* Header */}
                            <div style={{
                                padding: "24px 28px 20px",
                                borderBottom: "1px solid #E8E5DF",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{
                                        width: "36px", height: "36px",
                                        borderRadius: "10px",
                                        background: "linear-gradient(135deg, #C9A96E 0%, #A8853C 100%)",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                        <Heart size={18} color="#FFFFFF" strokeWidth={2} />
                                    </div>
                                    <div>
                                        <h2 style={{
                                            fontFamily: "'Noto Serif KR', serif",
                                            fontSize: "18px", fontWeight: 700,
                                            color: "#0B2040", margin: 0, lineHeight: 1.3,
                                        }}>
                                            세실리아
                                        </h2>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "12px", color: "#9C9891",
                                            margin: 0, marginTop: "2px",
                                        }}>
                                            AI 영성 상담 · 마음에 맞는 행사와 성가를 찾아드립니다
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    style={{
                                        width: "32px", height: "32px",
                                        borderRadius: "8px", border: "none",
                                        backgroundColor: "transparent",
                                        color: "#9C9891", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#F0EFE9";
                                        (e.currentTarget as HTMLElement).style.color = "#100F0F";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                                        (e.currentTarget as HTMLElement).style.color = "#9C9891";
                                    }}
                                >
                                    <X size={18} strokeWidth={2} />
                                </button>
                            </div>

                            {/* Scrollable Body */}
                            <div style={{
                                flex: 1, overflowY: "auto",
                                padding: "24px 28px",
                            }}>
                                {/* Input Area */}
                                <div style={{ marginBottom: "20px" }}>
                                    <label style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px", fontWeight: 500,
                                        color: "#52504B",
                                        display: "block", marginBottom: "8px",
                                    }}>
                                        지금 어떤 마음이신가요?
                                    </label>
                                    <div style={{ position: "relative" }}>
                                        <textarea
                                            ref={inputRef}
                                            value={feeling}
                                            onChange={(e) => setFeeling(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="자유롭게 마음을 표현해 주세요..."
                                            rows={3}
                                            maxLength={500}
                                            style={{
                                                width: "100%",
                                                padding: "14px 50px 14px 16px",
                                                borderRadius: "12px",
                                                border: "1.5px solid #E8E5DF",
                                                backgroundColor: "#F8F7F4",
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "15px", lineHeight: 1.6,
                                                color: "#100F0F",
                                                resize: "none", outline: "none",
                                                transition: "border-color 0.2s ease",
                                                boxSizing: "border-box",
                                            }}
                                            onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E"}
                                            onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E8E5DF"}
                                        />
                                        <button
                                            onClick={handleSubmit}
                                            disabled={feeling.trim().length < 2 || isLoading}
                                            style={{
                                                position: "absolute", right: "10px", bottom: "10px",
                                                width: "36px", height: "36px",
                                                borderRadius: "10px", border: "none",
                                                backgroundColor: feeling.trim().length >= 2 && !isLoading ? "#0B2040" : "#E8E5DF",
                                                color: feeling.trim().length >= 2 && !isLoading ? "#FFFFFF" : "#9C9891",
                                                cursor: feeling.trim().length >= 2 && !isLoading ? "pointer" : "default",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <Send size={16} strokeWidth={2} />
                                        </button>
                                    </div>
                                    <div style={{
                                        display: "flex", justifyContent: "flex-end",
                                        marginTop: "4px",
                                    }}>
                                        <span style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "11px", color: "#9C9891",
                                        }}>
                                            {feeling.length}/500
                                        </span>
                                    </div>
                                </div>

                                {/* Example Prompts (before result) */}
                                {!hasResult && !isLoading && (
                                    <div style={{ marginBottom: "16px" }}>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "12px", color: "#9C9891",
                                            marginBottom: "10px",
                                        }}>
                                            이런 마음을 나눠보세요
                                        </p>
                                        <div style={{
                                            display: "flex", flexWrap: "wrap", gap: "8px",
                                        }}>
                                            {EXAMPLE_PROMPTS.map((prompt) => (
                                                <button
                                                    key={prompt}
                                                    onClick={() => handleExampleClick(prompt)}
                                                    style={{
                                                        padding: "8px 14px",
                                                        borderRadius: "20px",
                                                        border: "1px solid #E8E5DF",
                                                        backgroundColor: "#FFFFFF",
                                                        fontFamily: "'Noto Sans KR', sans-serif",
                                                        fontSize: "13px", color: "#52504B",
                                                        cursor: "pointer",
                                                        transition: "all 0.15s ease",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                    onMouseEnter={e => {
                                                        (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                                                        (e.currentTarget as HTMLElement).style.color = "#C9A96E";
                                                        (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(201,169,110,0.05)";
                                                    }}
                                                    onMouseLeave={e => {
                                                        (e.currentTarget as HTMLElement).style.borderColor = "#E8E5DF";
                                                        (e.currentTarget as HTMLElement).style.color = "#52504B";
                                                        (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF";
                                                    }}
                                                >
                                                    {prompt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Loading */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            padding: "40px 20px",
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", gap: "16px",
                                        }}
                                    >
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                        >
                                            <Sparkles size={28} color="#C9A96E" />
                                        </motion.div>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "14px", color: "#9C9891",
                                            textAlign: "center",
                                        }}>
                                            세실리아가 마음에 맞는 행사와 성가를 찾고 있습니다...
                                        </p>
                                    </motion.div>
                                )}

                                {/* Result */}
                                {hasResult && (
                                    <motion.div
                                        ref={resultRef}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* AI Message */}
                                        {aiMessage && (
                                            <div style={{
                                                padding: "18px 20px",
                                                borderRadius: "14px",
                                                backgroundColor: "rgba(201,169,110,0.06)",
                                                border: "1px solid rgba(201,169,110,0.15)",
                                                marginBottom: "20px",
                                            }}>
                                                <div style={{
                                                    display: "flex", alignItems: "flex-start", gap: "10px",
                                                }}>
                                                    <Sparkles size={16} color="#C9A96E" style={{ flexShrink: 0, marginTop: "2px" }} />
                                                    <p style={{
                                                        fontFamily: "'Noto Sans KR', sans-serif",
                                                        fontSize: "14px", lineHeight: 1.7,
                                                        color: "#100F0F", margin: 0,
                                                    }}>
                                                        {aiMessage}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Hymn Recommendation */}
                                        {hymn && (
                                            <div style={{
                                                padding: "16px 20px",
                                                borderRadius: "14px",
                                                backgroundColor: "rgba(11,32,64,0.03)",
                                                border: "1px solid rgba(11,32,64,0.08)",
                                                marginBottom: "20px",
                                            }}>
                                                <div style={{
                                                    display: "flex", alignItems: "flex-start", gap: "10px",
                                                }}>
                                                    <Music size={16} color="#0B2040" style={{ flexShrink: 0, marginTop: "2px" }} />
                                                    <div>
                                                        <p style={{
                                                            fontFamily: "'DM Mono', monospace",
                                                            fontSize: "11px", fontWeight: 500,
                                                            color: "#C9A96E",
                                                            margin: "0 0 6px", letterSpacing: "0.05em",
                                                            textTransform: "uppercase",
                                                        }}>
                                                            세실리아가 추천하는 성가
                                                        </p>
                                                        <p style={{
                                                            fontFamily: "'Noto Serif KR', serif",
                                                            fontSize: "14px", lineHeight: 1.7,
                                                            color: "#0B2040", margin: 0,
                                                            fontStyle: "italic",
                                                        }}>
                                                            {hymn}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Recommended Events */}
                                        {recommendations.length > 0 && (
                                            <div>
                                                <p style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "13px", fontWeight: 600,
                                                    color: "#0B2040", marginBottom: "12px",
                                                }}>
                                                    추천 행사
                                                </p>
                                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                                    {recommendations.map((rec, i) => (
                                                        <motion.div
                                                            key={rec.eventId}
                                                            initial={{ opacity: 0, x: -8 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.08 }}
                                                        >
                                                            <Link
                                                                href={`/events/${rec.eventId}`}
                                                                onClick={onClose}
                                                                style={{
                                                                    display: "block",
                                                                    padding: "16px 18px",
                                                                    borderRadius: "12px",
                                                                    border: "1px solid #E8E5DF",
                                                                    backgroundColor: "#FFFFFF",
                                                                    textDecoration: "none",
                                                                    transition: "all 0.15s ease",
                                                                }}
                                                                onMouseEnter={e => {
                                                                    (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 12px rgba(201,169,110,0.12)";
                                                                }}
                                                                onMouseLeave={e => {
                                                                    (e.currentTarget as HTMLElement).style.borderColor = "#E8E5DF";
                                                                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                                                                }}
                                                            >
                                                                {rec.event ? (
                                                                    <>
                                                                        <div style={{
                                                                            display: "flex", alignItems: "center",
                                                                            justifyContent: "space-between", marginBottom: "6px",
                                                                        }}>
                                                                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                                                <span style={{
                                                                                    display: "inline-block",
                                                                                    padding: "2px 8px",
                                                                                    borderRadius: "4px",
                                                                                    backgroundColor: CATEGORY_COLORS[rec.event.category] || "#666",
                                                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                                                    fontSize: "11px", fontWeight: 600,
                                                                                    color: "#FFFFFF",
                                                                                }}>
                                                                                    {rec.event.category}
                                                                                </span>
                                                                                <span style={{
                                                                                    fontFamily: "'DM Mono', monospace",
                                                                                    fontSize: "12px", color: "#9C9891",
                                                                                }}>
                                                                                    {rec.event.date}
                                                                                </span>
                                                                            </div>
                                                                            <ArrowUpRight size={16} color="#9C9891" />
                                                                        </div>
                                                                        <h4 style={{
                                                                            fontFamily: "'Noto Serif KR', serif",
                                                                            fontSize: "15px", fontWeight: 600,
                                                                            color: "#0B2040", margin: "0 0 4px",
                                                                            lineHeight: 1.4,
                                                                        }}>
                                                                            {rec.event.title}
                                                                        </h4>
                                                                        <p style={{
                                                                            fontFamily: "'Noto Sans KR', sans-serif",
                                                                            fontSize: "12px", color: "#9C9891",
                                                                            margin: "0 0 8px",
                                                                        }}>
                                                                            {rec.event.location}
                                                                        </p>
                                                                    </>
                                                                ) : (
                                                                    <h4 style={{
                                                                        fontFamily: "'Noto Serif KR', serif",
                                                                        fontSize: "15px", fontWeight: 600,
                                                                        color: "#0B2040", margin: "0 0 8px",
                                                                    }}>
                                                                        행사 정보
                                                                    </h4>
                                                                )}
                                                                <p style={{
                                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                                    fontSize: "13px", lineHeight: 1.6,
                                                                    color: "#52504B", margin: 0,
                                                                    padding: "8px 12px",
                                                                    borderRadius: "8px",
                                                                    backgroundColor: "#F8F7F4",
                                                                }}>
                                                                    {rec.reason}
                                                                </p>
                                                            </Link>
                                                        </motion.div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Try Again */}
                                        <div style={{
                                            textAlign: "center",
                                            marginTop: "20px", paddingTop: "16px",
                                            borderTop: "1px solid #F0EFE9",
                                        }}>
                                            <button
                                                onClick={() => {
                                                    setFeeling("");
                                                    setAiMessage("");
                                                    setHymn("");
                                                    setRecommendations([]);
                                                    setHasResult(false);
                                                    setTimeout(() => inputRef.current?.focus(), 100);
                                                }}
                                                style={{
                                                    padding: "10px 24px",
                                                    borderRadius: "10px",
                                                    border: "1.5px solid #E8E5DF",
                                                    backgroundColor: "transparent",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "13px", fontWeight: 500,
                                                    color: "#52504B", cursor: "pointer",
                                                    transition: "all 0.15s ease",
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "#0B2040";
                                                    (e.currentTarget as HTMLElement).style.color = "#0B2040";
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "#E8E5DF";
                                                    (e.currentTarget as HTMLElement).style.color = "#52504B";
                                                }}
                                            >
                                                다른 마음으로 다시 상담하기
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
