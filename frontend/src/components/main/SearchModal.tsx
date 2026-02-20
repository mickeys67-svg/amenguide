import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ArrowUpRight, Sparkles } from "lucide-react";
import { EventData } from "./EventCard";
import Link from "next/link";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: EventData[];
}

const CATEGORY_COLORS: Record<string, string> = {
    피정: "#C9A96E",
    강의: "#8BB8A0",
    강론: "#9B8EC4",
    특강: "#C47B6B",
    피정의집: "#6B9BC4",
};

export function SearchModal({ isOpen, onClose, events }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [isSemantic, setIsSemantic] = useState(false);
    const [semanticResults, setSemanticResults] = useState<EventData[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            setQuery("");
            setSemanticResults([]);
            setIsSearching(false);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    // Semantic Search Effect with Debounce
    useEffect(() => {
        if (!isSemantic || query.trim().length < 2) {
            setSemanticResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/events/semantic?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const data = await response.json();
                    setSemanticResults(data);
                }
            } catch (error) {
                console.error("Semantic search failed", error);
            } finally {
                setIsSearching(false);
            }
        }, 600);

        return () => clearTimeout(timer);
    }, [query, isSemantic]);

    const results = isSemantic
        ? semanticResults
        : query.trim().length > 0
            ? events.filter(
                (e) =>
                    e.title.includes(query) ||
                    e.category.includes(query) ||
                    e.location.includes(query) ||
                    e.organizer.includes(query) ||
                    e.tags?.some((t) => t.includes(query))
            )
            : [];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 z-[200]"
                        style={{ backgroundColor: "rgba(8,7,5,0.92)", backdropFilter: "blur(8px)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-0 left-0 right-0 z-[201] px-6 md:px-16 pt-20 md:pt-32"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                        {/* Search Mode Toggle */}
                        <div className="mb-6 flex justify-end">
                            <button
                                onClick={() => setIsSemantic(!isSemantic)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
                                style={{
                                    backgroundColor: isSemantic ? "#C9A96E" : "rgba(201,169,110,0.1)",
                                    border: `1px solid ${isSemantic ? "#C9A96E" : "rgba(201,169,110,0.3)"}`
                                }}
                            >
                                <Sparkles size={14} style={{ color: isSemantic ? "#080705" : "#C9A96E" }} />
                                <span style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    color: isSemantic ? "#080705" : "#C9A96E"
                                }}>
                                    {isSemantic ? "영적 AI 검색 (ON)" : "영적 AI 검색 (OFF)"}
                                </span>
                            </button>
                        </div>

                        {/* Search input */}
                        <div
                            className="relative flex items-center"
                            style={{ borderBottom: `2px solid ${isSemantic ? "#C9A96E" : "rgba(201,169,110,0.4)"}` }}
                        >
                            <Search size={22} style={{ color: "rgba(201,169,110,0.6)" }} className="shrink-0 mr-4" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={isSemantic ? "현재의 마음 상태나 찾고 싶은 영성을 입력하세요... (예: 위로받고 싶어요)" : "행사명, 장소, 카테고리 검색..."}
                                className="flex-1 bg-transparent outline-none py-4"
                                style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    color: "#F5F0E8",
                                    fontSize: "clamp(20px, 3vw, 36px)",
                                    fontWeight: 500,
                                    letterSpacing: "-0.02em",
                                }}
                            />
                            {isSearching && (
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    className="mr-4"
                                >
                                    <Sparkles size={18} style={{ color: "#C9A96E" }} />
                                </motion.div>
                            )}
                            <button onClick={onClose} style={{ color: "rgba(245,240,232,0.4)" }}>
                                <X size={20} />
                            </button>
                        </div>

                        {/* Results */}
                        <div className="mt-6 max-h-[55vh] overflow-y-auto custom-scrollbar">
                            <AnimatePresence mode="popLayout">
                                {results.map((event, i) => {
                                    const catColor = CATEGORY_COLORS[event.category] || "#C9A96E";
                                    return (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: 10 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link href={`/events/${event.id}`} onClick={onClose}>
                                                <div
                                                    className="flex items-center gap-4 py-4 cursor-pointer group"
                                                    style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                                                >
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full shrink-0"
                                                        style={{ backgroundColor: catColor }}
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            style={{
                                                                fontFamily: "'Noto Serif KR', serif",
                                                                color: "#F5F0E8",
                                                                fontSize: "16px",
                                                                fontWeight: 600,
                                                            }}
                                                        >
                                                            {event.title}
                                                        </p>
                                                        <p
                                                            style={{
                                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                                color: "rgba(245,240,232,0.35)",
                                                                fontSize: "12px",
                                                                marginTop: "2px",
                                                            }}
                                                        >
                                                            {event.category} · {event.location} · {event.date}
                                                        </p>
                                                    </div>
                                                    <ArrowUpRight size={14} style={{ color: "rgba(245,240,232,0.3)" }} className="shrink-0 group-hover:text-white transition-colors" />
                                                </div>
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {query.trim().length > 0 && results.length === 0 && !isSearching && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-10 text-center"
                            >
                                <p style={{ fontFamily: "'Noto Serif KR', serif", color: "rgba(245,240,232,0.3)", fontSize: "18px" }}>
                                    검색 결과가 없습니다
                                </p>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "rgba(245,240,232,0.2)", fontSize: "13px", marginTop: "8px" }}>
                                    {isSemantic ? "영적 AI가 결과를 찾는 중이거나, 다른 표현을 시도해 보세요" : "다른 키워드로 검색해 보세요"}
                                </p>
                            </motion.div>
                        )}

                        {query.trim().length === 0 && !isSearching && (
                            <div className="mt-8">
                                <p className="mb-3 text-[11px] text-[rgba(201,169,110,0.5)] font-bold tracking-widest uppercase">
                                    추천 검색어
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {["침묵 피정", "청년 기도회", "수도원 생활", "가톨릭 영화", "위로가 필요할 때", "가정 성화"].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => setQuery(tag)}
                                            className="px-3 py-1.5 transition-all duration-200 hover:opacity-80 rounded-sm"
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                border: "1px solid rgba(201,169,110,0.25)",
                                                color: "rgba(201,169,110,0.7)",
                                                fontSize: "12px",
                                            }}
                                        >
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
