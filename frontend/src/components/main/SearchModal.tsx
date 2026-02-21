import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, ArrowUpRight, Sparkles } from "lucide-react";
import { EventData, CATEGORY_COLORS } from "../../types/event";
import { apiFetch } from "../../utils/api";
import Link from "next/link";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    events: EventData[];
}

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
                const data = await apiFetch<EventData[]>(`/events/semantic?q=${encodeURIComponent(query)}`);
                setSemanticResults(data);
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
                (e: EventData) =>
                    e.title.includes(query) ||
                    e.category.includes(query) ||
                    e.location.includes(query) ||
                    e.organizer.includes(query) ||
                    e.tags?.some((t: string) => t.includes(query))
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
                    >
                        <div className="max-w-5xl mx-auto">
                            <div className="flex items-center justify-between mb-12">
                                <StainedGlassIcon />
                                <button onClick={onClose} className="p-3 text-[rgba(245,240,232,0.4)] hover:text-[#C9A96E] transition-colors">
                                    <X size={28} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="relative group mb-8">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#C9A96E]/40" size={24} strokeWidth={1.5} />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder={isSemantic ? "영성적인 질문이나 필요하신 은총을 말씀해 보세요..." : "검색어를 입력하세요..."}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="w-full bg-[rgba(245,240,232,0.03)] border-b border-[rgba(201,169,110,0.2)] py-8 pl-16 pr-8 text-2xl md:text-3xl font-light text-[#F5F0E8] placeholder:text-[rgba(245,240,232,0.15)] focus:outline-none focus:border-[#C9A96E] transition-all"
                                    style={{ fontFamily: "'Playfair Display', serif" }}
                                />

                                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-4">
                                    <button
                                        onClick={() => setIsSemantic(!isSemantic)}
                                        className={`flex items-center gap-2 px-6 py-2 rounded-full border transition-all ${isSemantic
                                                ? "bg-[#C9A96E]/10 border-[#C9A96E] text-[#C9A96E]"
                                                : "border-[rgba(245,240,232,0.1)] text-[rgba(245,240,232,0.4)] hover:border-[rgba(245,240,232,0.3)]"
                                            }`}
                                    >
                                        <Sparkles size={16} className={isSemantic ? "animate-pulse" : ""} />
                                        <span className="text-xs font-medium uppercase tracking-[0.1em]">AI Semantic</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] pr-4 custom-scrollbar">
                                {isSearching ? (
                                    <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-40">
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                                            className="w-8 h-8 border-2 border-[#C9A96E]/20 border-t-[#C9A96E] rounded-full"
                                        />
                                        <p className="text-xs uppercase tracking-[0.2em] text-[#C9A96E]">하느님의 뜻을 찾는 중...</p>
                                    </div>
                                ) : results.length > 0 ? (
                                    results.map((event: EventData, i: number) => (
                                        <motion.div
                                            key={event.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                        >
                                            <Link
                                                href={`/events/${event.id}`}
                                                onClick={onClose}
                                                className="group flex items-center justify-between p-6 rounded-xl hover:bg-[rgba(201,169,110,0.05)] border border-transparent hover:border-[rgba(201,169,110,0.1)] transition-all"
                                            >
                                                <div className="flex items-center gap-8">
                                                    <div
                                                        className="w-1.5 h-1.5 rounded-full"
                                                        style={{ backgroundColor: CATEGORY_COLORS[event.category] || "#666" }}
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <span className="text-[10px] uppercase tracking-[0.15em] opacity-40 font-medium">{event.category}</span>
                                                            <span className="text-[10px] opacity-20">—</span>
                                                            <span className="text-[10px] uppercase tracking-[0.1em] text-[#C9A96E]">{event.date}</span>
                                                        </div>
                                                        <h4 className="text-lg text-[rgba(245,240,232,0.8)] group-hover:text-[#F5F0E8] transition-colors line-clamp-1">{event.title}</h4>
                                                    </div>
                                                </div>
                                                <ArrowUpRight size={20} className="text-[rgba(245,240,232,0.2)] group-hover:text-[#C9A96E] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                            </Link>
                                        </motion.div>
                                    ))
                                ) : query.trim() ? (
                                    <div className="py-20 text-center opacity-30">
                                        <p className="text-sm tracking-widest uppercase">일치하는 내용을 찾을 수 없습니다.</p>
                                    </div>
                                ) : (
                                    <div className="py-20 flex flex-col items-center gap-6 opacity-20">
                                        <div className="grid grid-cols-3 gap-8">
                                            {[1, 2, 3].map(i => <div key={i} className="w-16 h-[1px] bg-[#C9A96E]" />)}
                                        </div>
                                        <p className="text-[10px] uppercase tracking-[0.3em]">Ready to seek?</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function StainedGlassIcon() {
    return (
        <div className="flex gap-1.5">
            {[1, 0.6, 0.3].map((op, i) => (
                <div
                    key={i}
                    className="w-1 h-6 rounded-full"
                    style={{ backgroundColor: `rgba(201,169,110,${op})` }}
                />
            ))}
        </div>
    );
}
