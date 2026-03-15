"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Sparkles, ArrowUpRight, Heart, Music, RotateCcw, Phone } from "lucide-react";
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

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    hymn?: string;
    recommendations?: Recommendation[];
}

// ── 위기 감지 키워드 ──
const CRISIS_KEYWORDS = [
    "죽고 싶", "자살", "자해", "살기 싫", "목숨", "극단적",
    "더 이상 못하겠", "끝내고 싶", "사라지고 싶", "없어지고 싶",
];

function detectCrisis(text: string): boolean {
    return CRISIS_KEYWORDS.some((kw) => text.includes(kw));
}

// ── 감정 카테고리 칩 ──
const EMOTION_CATEGORIES = [
    {
        label: "마음이 힘들 때",
        prompts: [
            "마음이 지치고 쉬고 싶어요",
            "외로움을 느끼고 있어요",
            "마음이 답답하고 우울해요",
        ],
    },
    {
        label: "신앙을 키우고 싶을 때",
        prompts: [
            "신앙을 더 깊이 알고 싶어요",
            "기도하는 법을 배우고 싶어요",
            "고해성사를 보고 싶은데 용기가 안 나요",
        ],
    },
    {
        label: "함께하고 싶을 때",
        prompts: [
            "같은 또래 친구들을 만나고 싶어요",
            "봉사활동에 참여하고 싶어요",
            "성지를 방문하고 싶어요",
        ],
    },
    {
        label: "감사하거나 기쁠 때",
        prompts: [
            "감사한 마음을 나누고 싶어요",
            "좋은 일이 생겨서 기도하고 싶어요",
        ],
    },
    {
        label: "고민이 있을 때",
        prompts: [
            "진로에 대해 고민이 많아요",
            "가족 관계가 어려워요",
            "용서가 잘 안 돼요",
        ],
    },
];

// ── 타이핑 이펙트 훅 ──
function useTypingEffect(text: string, speed = 20): { displayed: string; isDone: boolean } {
    const [displayed, setDisplayed] = useState("");
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        if (!text) {
            setDisplayed("");
            setIsDone(true);
            return;
        }
        setDisplayed("");
        setIsDone(false);
        let i = 0;
        const timer = setInterval(() => {
            i++;
            setDisplayed(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(timer);
                setIsDone(true);
            }
        }, speed);
        return () => clearInterval(timer);
    }, [text, speed]);

    return { displayed, isDone };
}

// ── 위기 감지 배너 ──
function CrisisBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: "14px 18px",
                borderRadius: "12px",
                backgroundColor: "rgba(220, 53, 69, 0.08)",
                border: "1px solid rgba(220, 53, 69, 0.25)",
                marginBottom: "16px",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <Phone size={16} color="#DC3545" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "13px", fontWeight: 600,
                        color: "#DC3545", margin: "0 0 8px",
                    }}>
                        당신의 생명은 소중합니다
                    </p>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "12px", lineHeight: 1.7,
                        color: "#52504B", margin: 0,
                    }}>
                        지금 힘든 상황이시라면, 전문 상담사와 대화해 주세요.
                    </p>
                    <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {[
                            { name: "자살예방상담전화", number: "1393" },
                            { name: "정신건강위기상담", number: "1577-0199" },
                            { name: "생명의전화", number: "1588-9191" },
                        ].map((line) => (
                            <a
                                key={line.number}
                                href={`tel:${line.number}`}
                                style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: "12px", color: "#DC3545",
                                    textDecoration: "none",
                                    fontWeight: 500,
                                }}
                            >
                                {line.name}: {line.number}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ── 어시스턴트 메시지 버블 (타이핑 이펙트) ──
function AssistantBubble({ msg, isLatest }: { msg: ChatMessage; isLatest: boolean }) {
    const { displayed, isDone } = useTypingEffect(
        isLatest ? msg.content : "",
        18
    );
    const text = isLatest ? displayed : msg.content;
    const showExtras = isLatest ? isDone : true;

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
        >
            {/* AI 메시지 */}
            <div style={{
                padding: "16px 18px",
                borderRadius: "16px 16px 16px 4px",
                backgroundColor: "rgba(201,169,110,0.06)",
                border: "1px solid rgba(201,169,110,0.15)",
                maxWidth: "92%",
            }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <div style={{
                        width: "24px", height: "24px", borderRadius: "8px",
                        background: "linear-gradient(135deg, #C9A96E 0%, #A8853C 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Heart size={12} color="#FFFFFF" strokeWidth={2.5} />
                    </div>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "14px", lineHeight: 1.8,
                        color: "#100F0F", margin: 0,
                        wordBreak: "keep-all",
                    }}>
                        {text}
                        {isLatest && !isDone && (
                            <span style={{
                                display: "inline-block", width: "2px", height: "16px",
                                backgroundColor: "#C9A96E", marginLeft: "2px",
                                verticalAlign: "text-bottom",
                                animation: "blink 1s step-end infinite",
                            }} />
                        )}
                    </p>
                </div>
            </div>

            {/* 성가 추천 */}
            {showExtras && msg.hymn && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    style={{
                        padding: "14px 18px",
                        borderRadius: "12px",
                        backgroundColor: "rgba(11,32,64,0.03)",
                        border: "1px solid rgba(11,32,64,0.08)",
                        maxWidth: "92%",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <Music size={15} color="#0B2040" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                            <p style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px", fontWeight: 500,
                                color: "#C9A96E", margin: "0 0 5px",
                                letterSpacing: "0.06em", textTransform: "uppercase",
                            }}>
                                세실리아가 추천하는 성가
                            </p>
                            <p style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "13px", lineHeight: 1.7,
                                color: "#0B2040", margin: 0,
                                fontStyle: "italic",
                            }}>
                                {msg.hymn}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 추천 행사 */}
            {showExtras && msg.recommendations && msg.recommendations.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                >
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "12px", fontWeight: 600,
                        color: "#9C9891", marginBottom: "8px",
                        paddingLeft: "4px",
                    }}>
                        추천 행사
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {msg.recommendations.map((rec, i) => (
                            <motion.div
                                key={rec.eventId}
                                initial={{ opacity: 0, x: -6 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Link
                                    href={`/events/${rec.eventId}`}
                                    style={{
                                        display: "block",
                                        padding: "14px 16px",
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
                                                justifyContent: "space-between", marginBottom: "5px",
                                            }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                                    <span style={{
                                                        display: "inline-block",
                                                        padding: "2px 8px",
                                                        borderRadius: "4px",
                                                        backgroundColor: CATEGORY_COLORS[rec.event.category] || "#666",
                                                        fontFamily: "'Noto Sans KR', sans-serif",
                                                        fontSize: "10px", fontWeight: 600,
                                                        color: "#FFFFFF",
                                                    }}>
                                                        {rec.event.category}
                                                    </span>
                                                    <span style={{
                                                        fontFamily: "'DM Mono', monospace",
                                                        fontSize: "11px", color: "#9C9891",
                                                    }}>
                                                        {rec.event.date}
                                                    </span>
                                                </div>
                                                <ArrowUpRight size={14} color="#9C9891" />
                                            </div>
                                            <h4 style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "14px", fontWeight: 600,
                                                color: "#0B2040", margin: "0 0 3px",
                                                lineHeight: 1.4,
                                            }}>
                                                {rec.event.title}
                                            </h4>
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "11px", color: "#9C9891",
                                                margin: "0 0 6px",
                                            }}>
                                                {rec.event.location}
                                            </p>
                                        </>
                                    ) : (
                                        <h4 style={{
                                            fontFamily: "'Noto Serif KR', serif",
                                            fontSize: "14px", fontWeight: 600,
                                            color: "#0B2040", margin: "0 0 6px",
                                        }}>
                                            행사 정보
                                        </h4>
                                    )}
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "12px", lineHeight: 1.6,
                                        color: "#52504B", margin: 0,
                                        padding: "6px 10px",
                                        borderRadius: "8px",
                                        backgroundColor: "#F8F7F4",
                                    }}>
                                        {rec.reason}
                                    </p>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}
        </motion.div>
    );
}

// ══════════════════════════════════════════════════════════════════════
// 메인 모달
// ══════════════════════════════════════════════════════════════════════
export function AiRecommendModal({ isOpen, onClose }: AiRecommendModalProps) {
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [showCrisis, setShowCrisis] = useState(false);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // 모달 열림/닫힘 시 상태 초기화
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        } else {
            setInput("");
            setMessages([]);
            setIsLoading(false);
            setShowCrisis(false);
            setActiveCategory(null);
        }
    }, [isOpen]);

    // ESC 닫기
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // 자동 스크롤
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
            }, 100);
        }
    }, [messages]);

    const handleSubmit = useCallback(async (text?: string) => {
        const feeling = (text || input).trim();
        if (feeling.length < 2 || isLoading) return;

        // 위기 감지
        if (detectCrisis(feeling)) {
            setShowCrisis(true);
        }

        // 사용자 메시지 추가
        const userMsg: ChatMessage = { role: "user", content: feeling };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";

            // 이전 대화 이력 구성 (AI 메시지는 content만 전달)
            const history = messages.map((m) => ({
                role: m.role,
                content: m.content,
            }));

            let data: AiResponse;
            try {
                const res = await fetch(`${API_BASE}/events/ai-recommend`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ feeling, history }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    throw new Error(`API Error: ${res.status}`);
                }
                data = await res.json();
            } finally {
                clearTimeout(timeoutId);
            }

            // 추천 행사 상세 정보 병렬 조회
            const recsWithEvents = await Promise.all(
                data.recommendations.map(async (rec) => {
                    try {
                        const event = await apiFetch<EventData>(`/events/${rec.eventId}`);
                        return {
                            ...rec,
                            event: {
                                ...event,
                                date: event.date
                                    ? new Date(event.date as string).toLocaleDateString("ko-KR")
                                    : "날짜 미정",
                                category: event.category || "피정",
                                location: event.location || "장소 미정",
                            },
                        } as Recommendation;
                    } catch {
                        return rec as Recommendation;
                    }
                })
            );

            // AI 응답에 위기 키워드가 있으면 배너 표시
            if (detectCrisis(data.message)) {
                setShowCrisis(true);
            }

            const aiMsg: ChatMessage = {
                role: "assistant",
                content: data.message,
                hymn: data.hymn || undefined,
                recommendations: recsWithEvents,
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch {
            const errorMsg: ChatMessage = {
                role: "assistant",
                content: "추천을 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.",
            };
            setMessages((prev) => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [input, isLoading, messages]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleReset = () => {
        setMessages([]);
        setInput("");
        setShowCrisis(false);
        setActiveCategory(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const hasConversation = messages.length > 0;

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
                            {/* ── Header ── */}
                            <div style={{
                                padding: "20px 24px 16px",
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
                                            fontSize: "17px", fontWeight: 700,
                                            color: "#0B2040", margin: 0, lineHeight: 1.3,
                                        }}>
                                            세실리아
                                        </h2>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "11px", color: "#9C9891",
                                            margin: 0, marginTop: "2px",
                                        }}>
                                            AI 영성 상담 · 마음에 맞는 행사와 성가를 찾아드립니다
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    {hasConversation && (
                                        <button
                                            onClick={handleReset}
                                            title="새 대화"
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
                                            <RotateCcw size={15} strokeWidth={2} />
                                        </button>
                                    )}
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
                            </div>

                            {/* ── Chat Body ── */}
                            <div style={{
                                flex: 1, overflowY: "auto",
                                padding: "20px 24px",
                                display: "flex", flexDirection: "column", gap: "16px",
                            }}>
                                {/* 위기 감지 배너 */}
                                {showCrisis && <CrisisBanner />}

                                {/* 대화 없을 때: 안내 + 감정 카테고리 */}
                                {!hasConversation && !isLoading && (
                                    <>
                                        {/* 환영 메시지 */}
                                        <div style={{
                                            textAlign: "center",
                                            padding: "16px 0 8px",
                                        }}>
                                            <Sparkles size={28} color="#C9A96E" style={{ marginBottom: "12px" }} />
                                            <p style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "16px", fontWeight: 600,
                                                color: "#0B2040", margin: "0 0 6px",
                                            }}>
                                                안녕하세요, 세실리아입니다
                                            </p>
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "13px", color: "#9C9891",
                                                lineHeight: 1.6, margin: 0,
                                            }}>
                                                <>지금 어떤 마음이신지 편하게 나눠주세요.<br />마음에 맞는 행사와 성가를 찾아드릴게요.</>
                                            </p>
                                        </div>

                                        {/* 감정 카테고리 */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                            {EMOTION_CATEGORIES.map((cat, ci) => (
                                                <div key={cat.label}>
                                                    <button
                                                        onClick={() => setActiveCategory(activeCategory === ci ? null : ci)}
                                                        style={{
                                                            display: "block", width: "100%",
                                                            padding: "10px 14px",
                                                            borderRadius: "10px",
                                                            border: "1px solid",
                                                            borderColor: activeCategory === ci ? "#C9A96E" : "#E8E5DF",
                                                            backgroundColor: activeCategory === ci ? "rgba(201,169,110,0.05)" : "#FFFFFF",
                                                            fontFamily: "'Noto Sans KR', sans-serif",
                                                            fontSize: "13px", fontWeight: 500,
                                                            color: activeCategory === ci ? "#C9A96E" : "#52504B",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                            transition: "all 0.15s ease",
                                                        }}
                                                    >
                                                        {cat.label}
                                                    </button>
                                                    <AnimatePresence>
                                                        {activeCategory === ci && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                style={{ overflow: "hidden" }}
                                                            >
                                                                <div style={{
                                                                    display: "flex", flexWrap: "wrap", gap: "6px",
                                                                    padding: "10px 4px 4px",
                                                                }}>
                                                                    {cat.prompts.map((prompt) => (
                                                                        <button
                                                                            key={prompt}
                                                                            onClick={() => {
                                                                                setInput(prompt);
                                                                                handleSubmit(prompt);
                                                                            }}
                                                                            style={{
                                                                                padding: "7px 13px",
                                                                                borderRadius: "18px",
                                                                                border: "1px solid #E8E5DF",
                                                                                backgroundColor: "#FFFFFF",
                                                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                                                fontSize: "12px", color: "#52504B",
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
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* 대화 메시지 */}
                                {messages.map((msg, i) => (
                                    <div key={i}>
                                        {msg.role === "user" ? (
                                            /* 사용자 버블 */
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{
                                                    display: "flex", justifyContent: "flex-end",
                                                }}
                                            >
                                                <div style={{
                                                    padding: "12px 16px",
                                                    borderRadius: "16px 16px 4px 16px",
                                                    backgroundColor: "#0B2040",
                                                    color: "#FFFFFF",
                                                    maxWidth: "80%",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "14px", lineHeight: 1.7,
                                                    wordBreak: "keep-all",
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            /* AI 버블 */
                                            <AssistantBubble
                                                msg={msg}
                                                isLatest={i === messages.length - 1}
                                            />
                                        )}
                                    </div>
                                ))}

                                {/* 로딩 */}
                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "10px",
                                            padding: "12px 16px",
                                        }}
                                    >
                                        <div style={{
                                            width: "24px", height: "24px", borderRadius: "8px",
                                            background: "linear-gradient(135deg, #C9A96E 0%, #A8853C 100%)",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                        }}>
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Sparkles size={12} color="#FFFFFF" />
                                            </motion.div>
                                        </div>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "13px", color: "#9C9891",
                                            margin: 0,
                                        }}>
                                            세실리아가 마음을 읽고 있습니다...
                                        </p>
                                    </motion.div>
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {/* ── Input Bar ── */}
                            <div style={{
                                padding: "16px 24px 20px",
                                borderTop: "1px solid #E8E5DF",
                                backgroundColor: "#FAFAF8",
                            }}>
                                <div style={{ position: "relative" }}>
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={hasConversation ? "더 나누고 싶은 이야기가 있으신가요..." : "자유롭게 마음을 표현해 주세요..."}
                                        rows={2}
                                        maxLength={500}
                                        style={{
                                            width: "100%",
                                            padding: "12px 48px 12px 16px",
                                            borderRadius: "14px",
                                            border: "1.5px solid #E8E5DF",
                                            backgroundColor: "#FFFFFF",
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "14px", lineHeight: 1.6,
                                            color: "#100F0F",
                                            resize: "none", outline: "none",
                                            transition: "border-color 0.2s ease",
                                            boxSizing: "border-box",
                                        }}
                                        onFocus={e => (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E"}
                                        onBlur={e => (e.currentTarget as HTMLElement).style.borderColor = "#E8E5DF"}
                                    />
                                    <button
                                        onClick={() => handleSubmit()}
                                        disabled={input.trim().length < 2 || isLoading}
                                        style={{
                                            position: "absolute", right: "8px", bottom: "8px",
                                            width: "34px", height: "34px",
                                            borderRadius: "10px", border: "none",
                                            backgroundColor: input.trim().length >= 2 && !isLoading ? "#0B2040" : "#E8E5DF",
                                            color: input.trim().length >= 2 && !isLoading ? "#FFFFFF" : "#9C9891",
                                            cursor: input.trim().length >= 2 && !isLoading ? "pointer" : "default",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.2s ease",
                                        }}
                                    >
                                        <Send size={15} strokeWidth={2} />
                                    </button>
                                </div>
                                <div style={{
                                    display: "flex", justifyContent: "flex-end",
                                    marginTop: "4px",
                                }}>
                                    <span style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "10px", color: "#9C9891",
                                    }}>
                                        {input.length}/500
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* 타이핑 커서 깜빡임 애니메이션 */}
                    <style>{`
                        @keyframes blink {
                            0%, 100% { opacity: 1; }
                            50% { opacity: 0; }
                        }
                    `}</style>
                </>
            )}
        </AnimatePresence>
    );
}
