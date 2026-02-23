import { motion } from "framer-motion";
import { CATEGORY_COLORS as BASE_CATEGORY_COLORS } from "../../types/event";


const FILTERS = [
    { label: "전체", value: "전체" },
    { label: "피정", value: "피정" },
    { label: "강의", value: "강의" },
    { label: "강론", value: "강론" },
    { label: "특강", value: "특강" },
    { label: "피정의집", value: "피정의집" },
];

const CATEGORY_COLORS: Record<string, string> = {
    전체: "#F5F0E8",
    ...BASE_CATEGORY_COLORS,
};


const SORT_OPTIONS = [
    { label: "최신순", value: "latest" },
    { label: "날짜순", value: "date" },
    { label: "지역순", value: "region" },
];

interface FilterBarProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    totalCount: number;
    viewMode: "grid" | "list";
    onViewModeChange: (mode: "grid" | "list") => void;
}

export function FilterBar({
    activeFilter,
    onFilterChange,
    sortBy,
    onSortChange,
    totalCount,
    viewMode,
    onViewModeChange,
}: FilterBarProps) {
    return (
        <div
            className="sticky top-16 md:top-20 z-40 py-3"
            style={{
                backgroundColor: "rgba(8,7,5,0.95)",
                backdropFilter: "blur(16px)",
                borderBottom: "1px solid rgba(245,240,232,0.06)",
            }}
        >
            <div className="sacred-rail flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {/* Category filters — scrollable on mobile */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none flex-1 pb-0.5 no-scrollbar">
                    {FILTERS.map((f, i) => {
                        const isActive = activeFilter === f.value;
                        const color = isActive ? CATEGORY_COLORS[f.value] : "transparent";
                        return (
                            <button
                                type="button"
                                key={f.value}
                                onClick={() => onFilterChange(f.value)}
                                className={`relative py-1.5 transition-all duration-300 shrink-0 rounded-sm ${i === 0 ? "pr-3 pl-0" : "px-3"}`}
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "12px",
                                    fontWeight: isActive ? 600 : 400,
                                    color: isActive ? "#080705" : "rgba(245,240,232,0.5)",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="filter-bg"
                                        className="absolute inset-0 rounded-sm"
                                        style={{ backgroundColor: color }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{f.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3 shrink-0 ml-auto">
                    {/* Count */}
                    <span
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "rgba(201,169,110,0.6)",
                            fontSize: "12px",
                        }}
                    >
                        {totalCount}건
                    </span>

                    {/* Sort */}
                    <div className="hidden md:flex items-center gap-2">
                        {SORT_OPTIONS.map((s) => (
                            <button
                                type="button"
                                key={s.value}
                                onClick={() => onSortChange(s.value)}
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "11px",
                                    color: sortBy === s.value ? "#C9A96E" : "rgba(245,240,232,0.3)",
                                    transition: "color 0.2s",
                                }}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>

                    {/* View mode */}
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => onViewModeChange("grid")}
                            className="p-1.5"
                            aria-label="그리드 보기"
                            style={{ color: viewMode === "grid" ? "#C9A96E" : "rgba(245,240,232,0.3)" }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <rect x="0" y="0" width="6" height="6" fill="currentColor" />
                                <rect x="8" y="0" width="6" height="6" fill="currentColor" />
                                <rect x="0" y="8" width="6" height="6" fill="currentColor" />
                                <rect x="8" y="8" width="6" height="6" fill="currentColor" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            onClick={() => onViewModeChange("list")}
                            className="p-1.5"
                            aria-label="리스트 보기"
                            style={{ color: viewMode === "list" ? "#C9A96E" : "rgba(245,240,232,0.3)" }}
                        >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <rect x="0" y="0" width="14" height="2.5" fill="currentColor" />
                                <rect x="0" y="5.5" width="14" height="2.5" fill="currentColor" />
                                <rect x="0" y="11" width="14" height="2.5" fill="currentColor" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
