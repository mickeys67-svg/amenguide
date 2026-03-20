"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ArrowUpRight, Heart, Music, RotateCcw, Phone, Gift, Download, Share2, BookOpen } from "lucide-react";
import { EventData, CATEGORY_COLORS } from "../../types/event";
import { apiFetch } from "../../utils/api";
import {
    type EmotionGrade,
    type HeartCardData,
    generateHeartCard,
    generateCeciliaLetter,
    downloadCard,
    shareCard,
    GRADE_THEMES,
} from "../../utils/heartCardCanvas";
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
    emotionGrade?: EmotionGrade;
    prayer?: string;
    bibleVerse?: string;
    recommendations: { eventId: string; reason: string }[];
}

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
    hymn?: string;
    emotionGrade?: EmotionGrade;
    prayer?: string;
    bibleVerse?: string;
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

// ── 감정 카테고리 (천주교 영성심리학 기반 10분류) ──
const EMOTION_CATEGORIES = [
    {
        label: "신앙의 갈증",
        icon: "✝️",
        color: "#C9A96E",
        desc: "영적 성장 · 기도 · 성사 · 전례",
        prompts: [
            "하느님을 더 깊이 만나고 싶어요",
            "기도가 메마르고 영적으로 건조한 시기를 보내고 있어요",
            "고해성사를 보고 싶은데 용기가 나지 않아요",
            "성경을 읽고 싶지만 어디서부터 시작할지 모르겠어요",
            "미사에 집중하기 어렵고 형식적으로 느껴져요",
            "전례에 대해 자세하게 알고 싶어요",
            "성가를 잘 부르고 싶어요",
        ],
    },
    {
        label: "슬픔과 상실",
        icon: "💧",
        color: "#5B8DEF",
        desc: "애도 · 이별 · 공허",
        prompts: [
            "소중한 사람을 떠나보내고 마음이 텅 빈 것 같아요",
            "이별 후 아무것도 할 수 없을 만큼 슬퍼요",
            "과거의 상처가 자꾸 떠올라서 힘들어요",
            "눈물이 멈추지 않고 마음이 무너지는 느낌이에요",
            "삶의 의미를 잃어버린 것 같아 공허해요",
        ],
    },
    {
        label: "불안과 두려움",
        icon: "🌊",
        color: "#6C8EBF",
        desc: "걱정 · 공포 · 초조",
        prompts: [
            "미래가 불확실해서 잠을 이룰 수 없어요",
            "실패할까 봐 새로운 시도가 두려워요",
            "알 수 없는 불안감이 계속 밀려와요",
            "건강 문제로 두려움에 사로잡혀 있어요",
            "무언가 나쁜 일이 일어날 것 같은 예감이 떠나지 않아요",
        ],
    },
    {
        label: "분노와 억울함",
        icon: "🔥",
        color: "#E07C5A",
        desc: "화 · 부당함 · 배신",
        prompts: [
            "부당한 대우를 받아서 화가 가라앉지 않아요",
            "믿었던 사람에게 배신당해 분노가 커요",
            "억울한 상황에서 아무도 내 편이 아닌 것 같아요",
            "참았던 감정이 폭발할 것 같아서 무서워요",
            "세상이 불공평하다는 생각이 자꾸 들어요",
        ],
    },
    {
        label: "외로움과 고립",
        icon: "🕯️",
        color: "#8B7355",
        desc: "소외 · 단절 · 고독",
        prompts: [
            "주변에 사람들은 많은데 마음을 나눌 사람이 없어요",
            "혼자라는 느낌이 깊어져서 견디기 힘들어요",
            "교우들 사이에서도 소속감을 느끼지 못해요",
            "가족 안에서도 이해받지 못하는 외로움이 있어요",
            "신앙 안에서도 하느님이 멀게 느껴질 때가 있어요",
        ],
    },
    {
        label: "지침과 번아웃",
        icon: "🍂",
        color: "#A0855B",
        desc: "피로 · 탈진 · 무기력",
        prompts: [
            "몸도 마음도 지쳐서 아무것도 하기 싫어요",
            "매일 반복되는 일상에 의미를 찾을 수 없어요",
            "열심히 살았는데 보람이 느껴지지 않아요",
            "쉬어도 피로가 풀리지 않아 무기력해요",
            "모든 책임감이 어깨를 짓누르는 것 같아요",
        ],
    },
    {
        label: "관계의 어려움",
        icon: "🤝",
        color: "#4ECDC4",
        desc: "갈등 · 용서 · 화해",
        prompts: [
            "가족과의 갈등이 깊어져서 마음이 아파요",
            "용서해야 한다는 걸 알지만 마음이 따라가지 않아요",
            "직장이나 공동체에서 인간관계가 힘들어요",
            "사랑하는 사람과 소통이 되지 않아 답답해요",
            "상처를 주고받은 관계를 회복하고 싶어요",
        ],
    },
    {
        label: "감사와 기쁨",
        icon: "🕊️",
        color: "#F2994A",
        desc: "감사 · 행복 · 은총",
        prompts: [
            "감사한 마음을 하느님께 온전히 드리고 싶어요",
            "좋은 일이 생겨서 기쁨을 나누고 싶어요",
            "일상 속 작은 축복을 깨달아 감동받았어요",
            "오랜 기도가 응답된 것 같아 벅차올라요",
            "힘든 시간을 지나 평화를 되찾아 감사해요",
        ],
    },
    {
        label: "진로와 소명",
        icon: "🌟",
        color: "#9B8EC4",
        desc: "결정 · 미래 · 부르심",
        prompts: [
            "진로를 정하지 못해 마음이 조급해요",
            "하느님이 원하시는 삶의 방향을 알고 싶어요",
            "중요한 결정 앞에서 분별의 지혜가 필요해요",
            "내 달란트가 무엇인지 아직 찾지 못했어요",
            "성소에 대해 진지하게 고민하고 있어요",
        ],
    },
    {
        label: "성장과 회심",
        icon: "🌱",
        color: "#5BA08E",
        desc: "변화 · 회개 · 새출발",
        prompts: [
            "나쁜 습관을 고치고 새사람이 되고 싶어요",
            "같은 죄를 반복하는 자신이 부끄럽고 괴로워요",
            "영적으로 한 단계 더 성숙해지고 싶어요",
            "냉담했던 신앙생활을 다시 시작하고 싶어요",
            "겸손하게 살고 싶은데 교만이 자꾸 올라와요",
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

// ── AI Orb 컴포넌트 (살아있는 생명체) ──
function AiOrb({ size = 40, animate = true }: { size?: number; animate?: boolean }) {
    return (
        <motion.div
            animate={animate ? {
                x: [0, 3, -2, 4, -3, 1, -4, 2, 0],
                y: [0, -2, 3, -4, 1, -3, 2, -1, 0],
            } : {}}
            transition={animate ? {
                x: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
            } : {}}
            style={{ position: "relative", width: size * 1.5, height: size * 1.5, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
            {/* 외부 후광 — 느린 호흡 */}
            {animate && (
                <motion.div
                    animate={{
                        scale: [1, 1.4, 1.1, 1.5, 1],
                        opacity: [0.25, 0.08, 0.2, 0.05, 0.25],
                    }}
                    transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        width: size * 1.4, height: size * 1.4,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(201,169,110,0.3) 0%, rgba(99,220,190,0.12) 40%, transparent 70%)",
                    }}
                />
            )}
            {/* 두 번째 후광 — 어긋난 리듬 */}
            {animate && (
                <motion.div
                    animate={{
                        scale: [1.1, 1, 1.3, 1],
                        opacity: [0.15, 0.3, 0.1, 0.15],
                    }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                    style={{
                        position: "absolute",
                        width: size * 1.2, height: size * 1.2,
                        borderRadius: "50%",
                        background: "radial-gradient(circle, rgba(14,165,233,0.15) 0%, rgba(99,220,190,0.1) 50%, transparent 70%)",
                    }}
                />
            )}
            {/* 메인 링 — 심장박동 리듬 */}
            <motion.div
                animate={animate ? {
                    scale: [1, 1.06, 1.02, 1.08, 1],
                    rotate: [0, 360],
                } : {}}
                transition={animate ? {
                    scale: { duration: 3.5, repeat: Infinity, ease: "easeInOut" },
                    rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                } : {}}
                style={{
                    width: size, height: size,
                    borderRadius: "50%",
                    background: "conic-gradient(from 180deg, #C9A96E, #63DCBE, #5B8DEF, #C9A96E)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 2px 12px rgba(201,169,110,0.25)",
                    padding: "2px",
                }}
            >
                <div style={{
                    width: size - 4, height: size - 4,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #FEFEFE 0%, #F8F7F4 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    {/* 내부 핵 — 반대 방향 회전 + 독립 호흡 */}
                    <motion.div
                        animate={animate ? {
                            rotate: -360,
                            scale: [1, 1.15, 0.95, 1.1, 1],
                        } : {}}
                        transition={animate ? {
                            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                            scale: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                        } : {}}
                        style={{
                            width: size * 0.35, height: size * 0.35,
                            borderRadius: "50%",
                            background: "conic-gradient(from 0deg, #C9A96E, #63DCBE, #5B8DEF, #C9A96E)",
                            boxShadow: "0 0 6px rgba(201,169,110,0.4), 0 0 12px rgba(99,220,190,0.2)",
                        }}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── 위기 감지 배너 ──
function CrisisBanner() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: "14px 18px",
                borderRadius: "14px",
                backgroundColor: "#FEF2F2",
                border: "1px solid #FECACA",
                marginBottom: "8px",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                <Phone size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "13px", fontWeight: 600,
                        color: "#DC2626", margin: "0 0 8px",
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
                                    fontSize: "12px", color: "#DC2626",
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

// ── 어시스턴트 메시지 버블 ──
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
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
        >
            {/* AI 메시지 */}
            <div style={{ display: "flex", gap: "10px", maxWidth: "92%" }}>
                <div style={{ flexShrink: 0, marginTop: "2px" }}>
                    <AiOrb size={28} animate={isLatest && !isDone} />
                </div>
                <div style={{
                    padding: "14px 18px",
                    borderRadius: "4px 18px 18px 18px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(0,0,0,0.05)",
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                    flex: 1,
                }}>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "14px", lineHeight: 1.85,
                        color: "#1A1A1A", margin: 0,
                        wordBreak: "keep-all",
                        letterSpacing: "-0.01em",
                    }}>
                        {text}
                        {isLatest && !isDone && (
                            <motion.span
                                animate={{ opacity: [1, 0, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                style={{
                                    display: "inline-block", width: "2px", height: "16px",
                                    backgroundColor: "#C9A96E", marginLeft: "2px",
                                    verticalAlign: "text-bottom",
                                }}
                            />
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
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #F0F9F6 0%, #F5F3EE 100%)",
                        border: "1px solid rgba(99,220,190,0.15)",
                        maxWidth: "92%",
                        marginLeft: "38px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <Music size={15} color="#4ECDC4" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                            <p style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px", fontWeight: 500,
                                color: "#4ECDC4", margin: "0 0 5px",
                                letterSpacing: "0.08em", textTransform: "uppercase",
                            }}>
                                추천 성가
                            </p>
                            <p style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "13px", lineHeight: 1.7,
                                color: "#2A2A2A", margin: 0,
                                fontStyle: "italic",
                            }}>
                                {msg.hymn}
                            </p>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* 성경 구절 */}
            {showExtras && msg.bibleVerse && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        padding: "14px 18px",
                        borderRadius: "14px",
                        background: "linear-gradient(135deg, #FBF8F1 0%, #F5F3EE 100%)",
                        border: "1px solid rgba(201,169,110,0.15)",
                        maxWidth: "92%",
                        marginLeft: "38px",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                        <BookOpen size={15} color="#C9A96E" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <div>
                            <p style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: "10px", fontWeight: 500,
                                color: "#C9A96E", margin: "0 0 5px",
                                letterSpacing: "0.08em", textTransform: "uppercase",
                            }}>
                                성경 말씀
                            </p>
                            <p style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "13px", lineHeight: 1.7,
                                color: "#2A2A2A", margin: 0,
                                fontStyle: "italic",
                            }}>
                                {msg.bibleVerse}
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
                    style={{ marginLeft: "38px" }}
                >
                    <p style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px", fontWeight: 500,
                        color: "#9C9891", marginBottom: "8px",
                        paddingLeft: "4px",
                        letterSpacing: "0.08em", textTransform: "uppercase",
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
                                        borderRadius: "14px",
                                        border: "1px solid rgba(0,0,0,0.06)",
                                        backgroundColor: "#FFFFFF",
                                        textDecoration: "none",
                                        transition: "all 0.2s ease",
                                        boxShadow: "0 1px 4px rgba(0,0,0,0.03)",
                                    }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 3px 16px rgba(201,169,110,0.1)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                                        (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.03)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
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
                                                fontFamily: "'Noto Sans KR', sans-serif",
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
                                            fontFamily: "'Noto Sans KR', sans-serif",
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

// ── Pulse Loading ──
function PulseLoader() {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
            <AiOrb size={28} animate />
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                {[0, 1, 2].map(i => (
                    <motion.div
                        key={i}
                        animate={{ scale: [0.7, 1.1, 0.7], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                        style={{
                            width: 5, height: 5,
                            borderRadius: "50%",
                            backgroundColor: "#C9A96E",
                        }}
                    />
                ))}
            </div>
            <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "12px", color: "#9C9891",
                margin: 0,
            }}>
                세실리아가 마음을 읽고 있습니다
            </p>
        </div>
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
    // ── 마음치료 상태 ──
    const [therapyMode, setTherapyMode] = useState<null | "card" | "letter">(null);
    const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
    const [letterImageUrl, setLetterImageUrl] = useState<string | null>(null);
    const [therapyLoading, setTherapyLoading] = useState(false);
    const [cardClaimed, setCardClaimed] = useState(false);
    const [therapyMessage, setTherapyMessage] = useState<string | null>(null);
    const [inputFocused, setInputFocused] = useState(false);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 150);
        } else {
            // 모달이 닫히면 진행 중인 fetch 취소
            abortRef.current?.abort();
            abortRef.current = null;
            setInput("");
            setMessages([]);
            setIsLoading(false);
            setShowCrisis(false);
            setActiveCategory(null);
            setTherapyMode(null);
            setCardImageUrl(null);
            setLetterImageUrl(null);
            setTherapyLoading(false);
            setCardClaimed(false);
            setTherapyMessage(null);
            setInputFocused(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

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

        if (detectCrisis(feeling)) {
            setShowCrisis(true);
        }

        const userMsg: ChatMessage = { role: "user", content: feeling };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setIsLoading(true);

        try {
            abortRef.current?.abort();
            const controller = new AbortController();
            abortRef.current = controller;
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";

            const history = messages.map((m) => ({
                role: m.role,
                content: m.role === "assistant" && (m.hymn || m.bibleVerse)
                    ? `${m.content}${m.hymn ? `\n[추천 성가: ${m.hymn}]` : ""}${m.bibleVerse ? `\n[인용 성경: ${m.bibleVerse}]` : ""}`
                    : m.content,
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

            if (detectCrisis(data.message)) {
                setShowCrisis(true);
            }

            const aiMsg: ChatMessage = {
                role: "assistant",
                content: data.message,
                hymn: data.hymn || undefined,
                emotionGrade: data.emotionGrade || "consolatio",
                prayer: data.prayer || undefined,
                bibleVerse: data.bibleVerse || undefined,
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
        setTherapyMode(null);
        setCardImageUrl(null);
        setLetterImageUrl(null);
        setTherapyLoading(false);
        setCardClaimed(false);
        setTherapyMessage(null);
        setTimeout(() => inputRef.current?.focus(), 100);
    };

    const lastAiMsg = [...messages].reverse().find((m) => m.role === "assistant" && m.emotionGrade);

    const handleTherapy = useCallback(async (mode: "card" | "letter") => {
        if (!lastAiMsg || therapyLoading) return;
        setTherapyLoading(true);
        setTherapyMessage(null);

        try {
            const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://amenguide-backend-775250805671.us-west1.run.app";

            if (!cardClaimed) {
                const res = await fetch(`${API_BASE}/events/ai-heart-card`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                });
                const result = await res.json();
                if (!result.allowed) {
                    if (result.alreadyUsed) {
                        setTherapyMessage("오늘은 이미 마음 선물을 받으셨어요. 내일 다시 만나요 \u{1F54A}\uFE0F");
                    } else {
                        setTherapyMessage("오늘의 마음 선물은 모두 전해졌어요. 내일 다시 만나요 \u{1F54A}\uFE0F");
                    }
                    setTherapyLoading(false);
                    return;
                }
                setCardClaimed(true);
            }

            const grade = (lastAiMsg.emotionGrade || "consolatio") as EmotionGrade;

            if (mode === "card") {
                const cardData: HeartCardData = {
                    message: lastAiMsg.content,
                    hymn: lastAiMsg.hymn,
                    emotionGrade: grade,
                    prayer: lastAiMsg.prayer,
                    bibleVerse: lastAiMsg.bibleVerse,
                    cardNumber: 0,
                };
                const url = await generateHeartCard(cardData);
                setCardImageUrl(url);
                setTherapyMode("card");
            } else {
                if (!lastAiMsg.prayer) {
                    setTherapyMessage("기도문을 생성하지 못했어요. 다시 상담해 주세요.");
                    setTherapyLoading(false);
                    return;
                }
                const url = await generateCeciliaLetter({
                    prayer: lastAiMsg.prayer,
                    emotionGrade: grade,
                    bibleVerse: lastAiMsg.bibleVerse,
                });
                setLetterImageUrl(url);
                setTherapyMode("letter");
            }
        } catch {
            setTherapyMessage("카드 생성 중 문제가 발생했습니다.");
        } finally {
            setTherapyLoading(false);
        }
    }, [lastAiMsg, therapyLoading, cardClaimed]);

    const hasConversation = messages.length > 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        style={{
                            position: "fixed", inset: 0, zIndex: 200,
                            backgroundColor: "rgba(11, 32, 64, 0.25)",
                            backdropFilter: "blur(12px) saturate(1.2)",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="cecilia-modal-wrap"
                        style={{
                            position: "fixed", inset: 0, zIndex: 201,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            pointerEvents: "none",
                        }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="cecilia-modal-inner"
                            style={{
                                width: "100%", maxWidth: "660px",
                                maxHeight: "88vh",
                                background: "linear-gradient(180deg, #FDFCFA 0%, #F5F3EE 100%)",
                                borderRadius: "24px",
                                border: "1px solid rgba(0,0,0,0.06)",
                                boxShadow: "0 32px 80px rgba(11,32,64,0.12), 0 0 0 1px rgba(255,255,255,0.8) inset",
                                overflow: "hidden",
                                display: "flex", flexDirection: "column",
                                pointerEvents: "auto",
                                position: "relative",
                            }}
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.97 }}
                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* Ambient warm glow — top */}
                            <div style={{
                                position: "absolute", top: "-60px", left: "30%",
                                width: "300px", height: "200px",
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)",
                                pointerEvents: "none",
                            }} />
                            {/* Ambient cool glow — bottom right */}
                            <div style={{
                                position: "absolute", bottom: "-40px", right: "10%",
                                width: "200px", height: "200px",
                                borderRadius: "50%",
                                background: "radial-gradient(circle, rgba(91,141,239,0.05) 0%, transparent 70%)",
                                pointerEvents: "none",
                            }} />

                            {/* ── Header ── */}
                            <div style={{
                                padding: "18px 24px 14px",
                                borderBottom: "1px solid rgba(0,0,0,0.05)",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                position: "relative",
                                zIndex: 1,
                                backgroundColor: "rgba(255,255,255,0.6)",
                                backdropFilter: "blur(16px)",
                            }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <AiOrb size={36} />
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <h2 style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "17px", fontWeight: 700,
                                                color: "#0B2040", margin: 0, lineHeight: 1.3,
                                            }}>
                                                세실리아
                                            </h2>
                                            <span style={{
                                                display: "inline-flex", alignItems: "center", gap: "3px",
                                                padding: "2px 8px",
                                                borderRadius: "6px",
                                                background: "linear-gradient(135deg, rgba(201,169,110,0.1) 0%, rgba(91,141,239,0.08) 100%)",
                                                border: "1px solid rgba(201,169,110,0.15)",
                                            }}>
                                                <span style={{
                                                    width: "6px", height: "6px", borderRadius: "50%",
                                                    background: "conic-gradient(from 0deg, #C9A96E, #63DCBE, #5B8DEF, #C9A96E)",
                                                }} />
                                                <span style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "9px", fontWeight: 600,
                                                    color: "#0B2040",
                                                    letterSpacing: "0.05em",
                                                }}>
                                                    AI
                                                </span>
                                            </span>
                                        </div>
                                        <p style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "11px", color: "#9C9891",
                                            margin: 0, marginTop: "2px",
                                        }}>
                                            영성 상담 · 행사 추천 · 마음 치유
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                    {hasConversation && (
                                        <button
                                            onClick={handleReset}
                                            title="새 대화"
                                            style={{
                                                width: "34px", height: "34px",
                                                borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)",
                                                backgroundColor: "rgba(255,255,255,0.6)",
                                                color: "#9C9891", cursor: "pointer",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF";
                                                (e.currentTarget as HTMLElement).style.color = "#0B2040";
                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.12)";
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.6)";
                                                (e.currentTarget as HTMLElement).style.color = "#9C9891";
                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                                            }}
                                        >
                                            <RotateCcw size={14} strokeWidth={2} />
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        style={{
                                            width: "34px", height: "34px",
                                            borderRadius: "10px", border: "1px solid rgba(0,0,0,0.06)",
                                            backgroundColor: "rgba(255,255,255,0.6)",
                                            color: "#9C9891", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={e => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = "#FFFFFF";
                                            (e.currentTarget as HTMLElement).style.color = "#0B2040";
                                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.12)";
                                        }}
                                        onMouseLeave={e => {
                                            (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.6)";
                                            (e.currentTarget as HTMLElement).style.color = "#9C9891";
                                            (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                                        }}
                                    >
                                        <X size={16} strokeWidth={2} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Chat Body ── */}
                            <div style={{
                                flex: 1, overflowY: "auto",
                                padding: "20px 24px",
                                display: "flex", flexDirection: "column", gap: "16px",
                                position: "relative",
                                zIndex: 1,
                            }}>
                                {showCrisis && <CrisisBanner />}

                                {/* 대화 없을 때 */}
                                {!hasConversation && !isLoading && (
                                    <>
                                        <div style={{
                                            textAlign: "center",
                                            padding: "28px 0 20px",
                                        }}>
                                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                                                <AiOrb size={56} />
                                            </div>
                                            <motion.p
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.2 }}
                                                style={{
                                                    fontFamily: "'Noto Serif KR', serif",
                                                    fontSize: "18px", fontWeight: 600,
                                                    color: "#0B2040", margin: "0 0 10px",
                                                }}
                                            >
                                                안녕하세요, 세실리아입니다
                                            </motion.p>
                                            <motion.p
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.3 }}
                                                style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "13px", color: "#9C9891",
                                                    lineHeight: 1.7, margin: 0,
                                                }}
                                            >
                                                지금 어떤 마음이신지 편하게 말씀해 주세요.<br />마음에 맞는 행사와 성가를 찾아드릴게요.
                                            </motion.p>
                                        </div>

                                        {/* 감정 카테고리 */}
                                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                                            {EMOTION_CATEGORIES.map((cat, ci) => (
                                                <motion.div
                                                    key={cat.label}
                                                    initial={{ opacity: 0, y: 8 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: 0.3 + ci * 0.05 }}
                                                >
                                                    <button
                                                        onClick={() => setActiveCategory(activeCategory === ci ? null : ci)}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: "10px",
                                                            width: "100%",
                                                            padding: "13px 16px",
                                                            borderRadius: "14px",
                                                            border: "1px solid",
                                                            borderColor: activeCategory === ci ? `${cat.color}40` : "rgba(0,0,0,0.05)",
                                                            backgroundColor: activeCategory === ci ? `${cat.color}08` : "#FFFFFF",
                                                            fontFamily: "'Noto Sans KR', sans-serif",
                                                            fontSize: "13.5px", fontWeight: 500,
                                                            color: activeCategory === ci ? cat.color : "#3A3A3A",
                                                            cursor: "pointer",
                                                            textAlign: "left",
                                                            transition: "all 0.2s ease",
                                                            boxShadow: activeCategory === ci
                                                                ? `0 2px 8px ${cat.color}12`
                                                                : "0 1px 3px rgba(0,0,0,0.02)",
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (activeCategory !== ci) {
                                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.1)";
                                                                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (activeCategory !== ci) {
                                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.05)";
                                                                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)";
                                                            }
                                                        }}
                                                    >
                                                        <span style={{ fontSize: "16px", flexShrink: 0 }}>{cat.icon}</span>
                                                        <span style={{ flex: 1 }}>{cat.label}</span>
                                                        {(cat as any).desc && (
                                                            <span style={{ fontSize: "11px", color: "#B0ADA8", fontWeight: 400 }}>{(cat as any).desc}</span>
                                                        )}
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
                                                                                padding: "8px 14px",
                                                                                borderRadius: "20px",
                                                                                border: "1px solid rgba(0,0,0,0.06)",
                                                                                backgroundColor: "#FFFFFF",
                                                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                                                fontSize: "12px", color: "#52504B",
                                                                                cursor: "pointer",
                                                                                transition: "all 0.2s ease",
                                                                                whiteSpace: "nowrap",
                                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                                                                            }}
                                                                            onMouseEnter={e => {
                                                                                (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                                                                                (e.currentTarget as HTMLElement).style.color = "#C9A96E";
                                                                                (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(201,169,110,0.1)";
                                                                            }}
                                                                            onMouseLeave={e => {
                                                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.06)";
                                                                                (e.currentTarget as HTMLElement).style.color = "#52504B";
                                                                                (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 2px rgba(0,0,0,0.02)";
                                                                            }}
                                                                        >
                                                                            {prompt}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* 대화 메시지 */}
                                {messages.map((msg, i) => (
                                    <div key={i}>
                                        {msg.role === "user" ? (
                                            <motion.div
                                                initial={{ opacity: 0, y: 6 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                style={{ display: "flex", justifyContent: "flex-end" }}
                                            >
                                                <div style={{
                                                    padding: "12px 18px",
                                                    borderRadius: "18px 18px 4px 18px",
                                                    background: "linear-gradient(135deg, #0B2040 0%, #1E3A5F 100%)",
                                                    color: "#FFFFFF",
                                                    maxWidth: "80%",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "14px", lineHeight: 1.7,
                                                    wordBreak: "keep-all",
                                                    boxShadow: "0 2px 8px rgba(11,32,64,0.15)",
                                                }}>
                                                    {msg.content}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <AssistantBubble
                                                msg={msg}
                                                isLatest={i === messages.length - 1}
                                            />
                                        )}
                                    </div>
                                ))}

                                {isLoading && <PulseLoader />}

                                {/* ── 마음치료 배너 ── */}
                                {lastAiMsg && !isLoading && !therapyMode && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.5 }}
                                        style={{
                                            padding: "18px 20px",
                                            borderRadius: "16px",
                                            background: "linear-gradient(135deg, #FBF8F1 0%, #F0F9F6 100%)",
                                            border: "1px solid rgba(201,169,110,0.15)",
                                            marginLeft: "38px",
                                            boxShadow: "0 2px 10px rgba(201,169,110,0.06)",
                                        }}
                                    >
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                                            <Gift size={16} color="#C9A96E" />
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "13px", fontWeight: 600,
                                                color: "#0B2040", margin: 0,
                                            }}>
                                                {cardClaimed
                                                    ? "마음 선물을 이미 받으셨어요"
                                                    : "오늘의 마음 선물"}
                                            </p>
                                        </div>
                                        {therapyMessage && (
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "12px", color: "#9C9891",
                                                margin: "0 0 8px", lineHeight: 1.6,
                                            }}>
                                                {therapyMessage}
                                            </p>
                                        )}
                                        {!cardClaimed && !therapyMessage && (
                                            <p style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "11px", color: "#9C9891",
                                                margin: "0 0 12px", lineHeight: 1.5,
                                            }}>
                                                하루 3명에게만 드리는 특별한 선물입니다
                                            </p>
                                        )}
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            <button
                                                onClick={() => handleTherapy("card")}
                                                disabled={therapyLoading || (!!therapyMessage && !cardClaimed)}
                                                style={{
                                                    padding: "9px 18px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #C9A96E",
                                                    backgroundColor: cardClaimed ? "transparent" : "#C9A96E",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "12px", fontWeight: 600,
                                                    color: cardClaimed ? "#C9A96E" : "#FFFFFF",
                                                    cursor: therapyLoading || (!!therapyMessage && !cardClaimed) ? "default" : "pointer",
                                                    opacity: therapyLoading || (!!therapyMessage && !cardClaimed) ? 0.4 : 1,
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <Heart size={13} />
                                                {therapyLoading ? "생성 중..." : "마음 카드"}
                                            </button>
                                            <button
                                                onClick={() => handleTherapy("letter")}
                                                disabled={therapyLoading || (!!therapyMessage && !cardClaimed)}
                                                style={{
                                                    padding: "9px 18px",
                                                    borderRadius: "10px",
                                                    border: "1px solid #0B2040",
                                                    backgroundColor: cardClaimed ? "transparent" : "#0B2040",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "12px", fontWeight: 600,
                                                    color: cardClaimed ? "#0B2040" : "#FFFFFF",
                                                    cursor: therapyLoading || (!!therapyMessage && !cardClaimed) ? "default" : "pointer",
                                                    opacity: therapyLoading || (!!therapyMessage && !cardClaimed) ? 0.4 : 1,
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    transition: "all 0.2s ease",
                                                }}
                                            >
                                                <BookOpen size={13} />
                                                {therapyLoading ? "생성 중..." : "세실리아의 편지"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* 카드/편지 미리보기 */}
                                {therapyMode && (cardImageUrl || letterImageUrl) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", gap: "12px",
                                            marginLeft: "38px",
                                        }}
                                    >
                                        {lastAiMsg?.emotionGrade && (
                                            <div style={{
                                                display: "flex", alignItems: "center", gap: "6px",
                                                padding: "4px 14px",
                                                borderRadius: "16px",
                                                backgroundColor: (GRADE_THEMES[lastAiMsg.emotionGrade]?.cardBg1 || "#C9A96E") + "12",
                                                border: `1px solid ${(GRADE_THEMES[lastAiMsg.emotionGrade]?.cardBg1 || "#C9A96E")}25`,
                                            }}>
                                                <span style={{ fontSize: "14px" }}>
                                                    {GRADE_THEMES[lastAiMsg.emotionGrade]?.emoji}
                                                </span>
                                                <span style={{
                                                    fontFamily: "'DM Mono', monospace",
                                                    fontSize: "11px", fontWeight: 500,
                                                    color: GRADE_THEMES[lastAiMsg.emotionGrade]?.cardBg1 || "#C9A96E",
                                                }}>
                                                    {GRADE_THEMES[lastAiMsg.emotionGrade]?.label} · {GRADE_THEMES[lastAiMsg.emotionGrade]?.latin}
                                                </span>
                                            </div>
                                        )}

                                        <div style={{
                                            width: "100%", maxWidth: "400px",
                                            borderRadius: "14px", overflow: "hidden",
                                            boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                        }}>
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={therapyMode === "card" ? cardImageUrl! : letterImageUrl!}
                                                alt={therapyMode === "card" ? "마음 카드" : "세실리아의 편지"}
                                                style={{ width: "100%", height: "auto", display: "block" }}
                                            />
                                        </div>

                                        <div style={{ display: "flex", gap: "8px" }}>
                                            <button
                                                onClick={() => {
                                                    const url = therapyMode === "card" ? cardImageUrl! : letterImageUrl!;
                                                    const name = therapyMode === "card" ? "cecilia-heart-card.png" : "cecilia-letter.png";
                                                    downloadCard(url, name);
                                                }}
                                                style={{
                                                    padding: "9px 20px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(0,0,0,0.08)",
                                                    backgroundColor: "#FFFFFF",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "12px", fontWeight: 500,
                                                    color: "#52504B",
                                                    cursor: "pointer",
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "#0B2040";
                                                    (e.currentTarget as HTMLElement).style.color = "#0B2040";
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)";
                                                    (e.currentTarget as HTMLElement).style.color = "#52504B";
                                                }}
                                            >
                                                <Download size={13} />
                                                저장
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    const url = therapyMode === "card" ? cardImageUrl! : letterImageUrl!;
                                                    const title = therapyMode === "card" ? "세실리아 마음 카드" : "세실리아의 편지";
                                                    const shared = await shareCard(url, title);
                                                    if (!shared) {
                                                        downloadCard(url, "cecilia-card.png");
                                                    }
                                                }}
                                                style={{
                                                    padding: "9px 20px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgba(201,169,110,0.3)",
                                                    backgroundColor: "rgba(201,169,110,0.06)",
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    fontSize: "12px", fontWeight: 500,
                                                    color: "#C9A96E",
                                                    cursor: "pointer",
                                                    display: "flex", alignItems: "center", gap: "6px",
                                                    transition: "all 0.2s ease",
                                                }}
                                                onMouseEnter={e => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(201,169,110,0.12)";
                                                    (e.currentTarget as HTMLElement).style.borderColor = "#C9A96E";
                                                }}
                                                onMouseLeave={e => {
                                                    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(201,169,110,0.06)";
                                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(201,169,110,0.3)";
                                                }}
                                            >
                                                <Share2 size={13} />
                                                공유
                                            </button>
                                        </div>

                                        {cardClaimed && (
                                            <div style={{ display: "flex", gap: "8px" }}>
                                                {therapyMode === "card" && (
                                                    <button
                                                        onClick={() => handleTherapy("letter")}
                                                        style={{
                                                            padding: "6px 14px", borderRadius: "8px",
                                                            border: "none", backgroundColor: "transparent",
                                                            fontFamily: "'Noto Sans KR', sans-serif",
                                                            fontSize: "11px", color: "#9C9891",
                                                            cursor: "pointer", textDecoration: "underline",
                                                            textUnderlineOffset: "3px",
                                                        }}
                                                    >
                                                        세실리아의 편지도 보기
                                                    </button>
                                                )}
                                                {therapyMode === "letter" && (
                                                    <button
                                                        onClick={() => handleTherapy("card")}
                                                        style={{
                                                            padding: "6px 14px", borderRadius: "8px",
                                                            border: "none", backgroundColor: "transparent",
                                                            fontFamily: "'Noto Sans KR', sans-serif",
                                                            fontSize: "11px", color: "#9C9891",
                                                            cursor: "pointer", textDecoration: "underline",
                                                            textUnderlineOffset: "3px",
                                                        }}
                                                    >
                                                        마음 카드도 보기
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* 기도문 */}
                                {cardClaimed && lastAiMsg?.prayer && !therapyMode && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        style={{
                                            padding: "16px 18px",
                                            borderRadius: "14px",
                                            background: "linear-gradient(135deg, #FBF8F1 0%, #F5F3EE 100%)",
                                            border: "1px solid rgba(201,169,110,0.12)",
                                            marginLeft: "38px",
                                        }}
                                    >
                                        <p style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "10px", fontWeight: 500,
                                            color: "#C9A96E", margin: "0 0 8px",
                                            letterSpacing: "0.06em",
                                        }}>
                                            세실리아가 드리는 기도문
                                        </p>
                                        <p style={{
                                            fontFamily: "'Noto Serif KR', serif",
                                            fontSize: "13px", lineHeight: 1.8,
                                            color: "#2A2A2A", margin: 0,
                                            fontStyle: "italic",
                                            whiteSpace: "pre-line",
                                        }}>
                                            {lastAiMsg.prayer}
                                        </p>
                                    </motion.div>
                                )}

                                <div ref={bottomRef} />
                            </div>

                            {/* ── Input Bar ── */}
                            <div style={{
                                padding: "12px 16px 16px",
                                borderTop: "1px solid rgba(0,0,0,0.05)",
                                backgroundColor: "rgba(255,255,255,0.7)",
                                backdropFilter: "blur(16px)",
                                position: "relative",
                                zIndex: 1,
                            }}>
                                <div style={{
                                    position: "relative",
                                    borderRadius: "16px",
                                    padding: inputFocused ? "1.5px" : "1px",
                                    background: inputFocused
                                        ? "conic-gradient(from 180deg, #C9A96E, #63DCBE, #5B8DEF, #C9A96E)"
                                        : "rgba(0,0,0,0.08)",
                                    transition: "all 0.3s ease",
                                    boxShadow: inputFocused ? "0 2px 16px rgba(201,169,110,0.12)" : "none",
                                }}>
                                    <div style={{
                                        borderRadius: "15px",
                                        backgroundColor: "#FFFFFF",
                                        position: "relative",
                                    }}>
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={(e) => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            onFocus={() => setInputFocused(true)}
                                            onBlur={() => setInputFocused(false)}
                                            placeholder={hasConversation ? "더 나누고 싶은 이야기가 있으신가요..." : "자유롭게 마음을 표현해 주세요..."}
                                            rows={2}
                                            maxLength={500}
                                            style={{
                                                width: "100%",
                                                padding: "14px 52px 14px 18px",
                                                borderRadius: "15px",
                                                border: "none",
                                                backgroundColor: "transparent",
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "14px", lineHeight: 1.6,
                                                color: "#1A1A1A",
                                                resize: "none", outline: "none",
                                                boxSizing: "border-box",
                                            }}
                                        />
                                        <button
                                            onClick={() => handleSubmit()}
                                            disabled={input.trim().length < 2 || isLoading}
                                            style={{
                                                position: "absolute", right: "10px", bottom: "10px",
                                                width: "36px", height: "36px",
                                                borderRadius: "10px", border: "none",
                                                background: input.trim().length >= 2 && !isLoading
                                                    ? "linear-gradient(135deg, #0B2040, #1E3A5F)"
                                                    : "#E8E5DF",
                                                color: input.trim().length >= 2 && !isLoading ? "#FFFFFF" : "#9C9891",
                                                cursor: input.trim().length >= 2 && !isLoading ? "pointer" : "default",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                transition: "all 0.2s ease",
                                                boxShadow: input.trim().length >= 2 && !isLoading
                                                    ? "0 2px 8px rgba(11,32,64,0.2)"
                                                    : "none",
                                            }}
                                        >
                                            <Send size={15} strokeWidth={2} />
                                        </button>
                                    </div>
                                </div>
                                <div style={{
                                    display: "flex", justifyContent: "space-between",
                                    alignItems: "center",
                                    marginTop: "6px",
                                    padding: "0 4px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                        <span style={{
                                            width: "5px", height: "5px", borderRadius: "50%",
                                            background: "conic-gradient(from 0deg, #C9A96E, #63DCBE, #5B8DEF, #C9A96E)",
                                        }} />
                                        <span style={{
                                            fontFamily: "'DM Mono', monospace",
                                            fontSize: "9px", color: "#C0BDB8",
                                            letterSpacing: "0.05em",
                                        }}>
                                            POWERED BY AI
                                        </span>
                                    </div>
                                    <span style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "10px", color: "#C0BDB8",
                                    }}>
                                        {input.length}/500
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* 모바일 최적화 */}
                    <style>{`
                        @media (min-width: 661px) {
                            .cecilia-modal-wrap {
                                padding: 20px;
                            }
                        }
                        @media (max-width: 660px) {
                            .cecilia-modal-inner {
                                max-height: 100vh !important;
                                max-height: 100dvh !important;
                                height: 100% !important;
                                border-radius: 0 !important;
                                border: none !important;
                            }
                        }
                        .cecilia-modal-inner ::-webkit-scrollbar {
                            width: 4px;
                        }
                        .cecilia-modal-inner ::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .cecilia-modal-inner ::-webkit-scrollbar-thumb {
                            background: rgba(0,0,0,0.08);
                            border-radius: 4px;
                        }
                        .cecilia-modal-inner ::-webkit-scrollbar-thumb:hover {
                            background: rgba(0,0,0,0.15);
                        }
                        .cecilia-modal-inner textarea::placeholder {
                            color: #C0BDB8;
                        }
                    `}</style>
                </>
            )}
        </AnimatePresence>
    );
}
