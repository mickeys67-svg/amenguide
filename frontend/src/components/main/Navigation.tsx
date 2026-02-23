import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search, ArrowRight } from "lucide-react";

interface NavigationProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onSearchOpen: () => void;
}

export function Navigation({ activeFilter, onFilterChange, onSearchOpen }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    const navLinks = [
        { label: "피정",    value: "피정"    },
        { label: "강의",    value: "강의"    },
        { label: "강론",    value: "강론"    },
        { label: "특강",    value: "특강"    },
        { label: "피정의집", value: "피정의집" },
    ];

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50"
                style={{
                    backgroundColor: scrolled ? "rgba(8,7,5,0.96)" : "transparent",
                    backdropFilter: scrolled ? "blur(20px)" : "none",
                    borderBottom: scrolled ? "1px solid rgba(201,169,110,0.08)" : "none",
                    transition: "background-color 0.4s ease, border-color 0.4s ease",
                }}
                initial={{ y: -80 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="sacred-rail">
                    <div className="flex items-center justify-between h-16 md:h-[72px]">

                        {/* ── 로고 ── */}
                        <button
                            type="button"
                            onClick={() => onFilterChange("전체")}
                            className="flex items-center gap-2.5 shrink-0"
                        >
                            {/* 십자가 마크 */}
                            <svg
                                width="14" height="18"
                                viewBox="0 0 14 18"
                                fill="#C9A96E"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <rect x="5.5" y="0" width="3" height="18" />
                                <rect x="0"   y="4" width="14" height="3" />
                            </svg>
                            <div className="flex flex-col leading-none gap-[3px]">
                                <span style={{
                                    fontFamily: "'Cinzel', serif",
                                    color: "#C9A96E",
                                    fontSize: "14px",
                                    letterSpacing: "0.2em",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                }}>
                                    CATHOLICA
                                </span>
                                <span style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.3)",
                                    fontSize: "9px",
                                    letterSpacing: "0.05em",
                                    fontWeight: 300,
                                    lineHeight: 1,
                                }}>
                                    가톨릭 행사 허브
                                </span>
                            </div>
                        </button>

                        {/* ── 데스크탑 카테고리 ── */}
                        <nav className="hidden md:flex items-center gap-8" aria-label="카테고리 필터">
                            {navLinks.map((link) => {
                                const isActive = activeFilter === link.value;
                                return (
                                    <button
                                        type="button"
                                        key={link.value}
                                        onClick={() => onFilterChange(isActive ? "전체" : link.value)}
                                        className="relative group"
                                        style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "11px",
                                            letterSpacing: "0.12em",
                                            textTransform: "uppercase",
                                            color: isActive
                                                ? "#F5F0E8"
                                                : "rgba(245,240,232,0.38)",
                                            fontWeight: isActive ? 500 : 400,
                                            paddingBottom: "20px",
                                            transition: "color 0.25s",
                                        }}
                                        onMouseEnter={e => {
                                            if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.75)";
                                        }}
                                        onMouseLeave={e => {
                                            if (!isActive) (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.38)";
                                        }}
                                    >
                                        {link.label}
                                        {/* 활성 언더라인 */}
                                        {isActive && (
                                            <motion.span
                                                layoutId="nav-underline"
                                                className="absolute bottom-3 left-0 right-0 h-px"
                                                style={{ backgroundColor: "#C9A96E" }}
                                                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                                            />
                                        )}
                                        {/* 호버 언더라인 */}
                                        {!isActive && (
                                            <span
                                                className="absolute bottom-3 left-0 right-0 h-px origin-left scale-x-0 group-hover:scale-x-100"
                                                style={{
                                                    backgroundColor: "rgba(245,240,232,0.12)",
                                                    transition: "transform 0.25s ease",
                                                }}
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </nav>

                        {/* ── 우측 액션 ── */}
                        <div className="flex items-center gap-1 md:gap-2">
                            {/* 검색 */}
                            <button
                                type="button"
                                aria-label="검색"
                                onClick={onSearchOpen}
                                className="w-9 h-9 flex items-center justify-center transition-colors duration-200"
                                style={{ color: "rgba(245,240,232,0.35)" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#C9A96E"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.35)"}
                            >
                                <Search size={15} strokeWidth={1.5} />
                            </button>

                            {/* 구분선 */}
                            <div className="hidden md:block w-px h-3.5 mx-1" style={{ backgroundColor: "rgba(245,240,232,0.1)" }} />

                            {/* 로그인 */}
                            <button
                                type="button"
                                className="hidden md:flex items-center px-3.5 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-all duration-200 border"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.42)",
                                    borderColor: "rgba(245,240,232,0.1)",
                                    fontWeight: 400,
                                    letterSpacing: "0.1em",
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = "#C9A96E";
                                    el.style.borderColor = "rgba(201,169,110,0.35)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = "rgba(245,240,232,0.42)";
                                    el.style.borderColor = "rgba(245,240,232,0.1)";
                                }}
                            >
                                로그인
                            </button>

                            {/* 모바일 햄버거 */}
                            <button
                                type="button"
                                aria-label="메뉴 열기"
                                className="md:hidden w-9 h-9 flex items-center justify-center transition-colors duration-200"
                                style={{ color: "rgba(245,240,232,0.6)" }}
                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F5F0E8"}
                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.6)"}
                                onClick={() => setMenuOpen(true)}
                            >
                                <Menu size={18} strokeWidth={1.5} />
                            </button>
                        </div>

                    </div>
                </div>
            </motion.nav>

            {/* ── 모바일 드로어 ── */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* 배경 딤처리 */}
                        <motion.div
                            className="fixed inset-0 z-[99]"
                            style={{ backgroundColor: "rgba(8,7,5,0.65)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => setMenuOpen(false)}
                        />

                        {/* 드로어 패널 */}
                        <motion.div
                            className="fixed top-0 right-0 bottom-0 z-[100] flex flex-col"
                            style={{
                                width: "72vw",
                                maxWidth: "300px",
                                backgroundColor: "#0C0A08",
                                borderLeft: "1px solid rgba(201,169,110,0.08)",
                            }}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ duration: 0.38, ease: [0.25, 0.46, 0.45, 0.94] }}
                        >
                            {/* 패널 헤더 */}
                            <div
                                className="flex items-center justify-between px-6 h-16 shrink-0"
                                style={{ borderBottom: "1px solid rgba(245,240,232,0.06)" }}
                            >
                                <div className="flex items-center gap-2">
                                    <svg width="11" height="14" viewBox="0 0 14 18" fill="#C9A96E" aria-hidden="true">
                                        <rect x="5.5" y="0" width="3" height="18" />
                                        <rect x="0" y="4" width="14" height="3" />
                                    </svg>
                                    <span style={{
                                        fontFamily: "'Cinzel', serif",
                                        color: "#C9A96E",
                                        fontSize: "12px",
                                        letterSpacing: "0.2em",
                                        fontWeight: 600,
                                    }}>
                                        CATHOLICA
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    aria-label="메뉴 닫기"
                                    onClick={() => setMenuOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center transition-colors duration-200"
                                    style={{ color: "rgba(245,240,232,0.3)" }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#F5F0E8"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.3)"}
                                >
                                    <X size={17} strokeWidth={1.5} />
                                </button>
                            </div>

                            {/* 카테고리 목록 */}
                            <div className="flex flex-col flex-1 overflow-y-auto px-6 pt-3">
                                {[{ label: "전체 행사", value: "전체" }, ...navLinks].map((link, i) => {
                                    const isActive = activeFilter === link.value;
                                    return (
                                        <motion.button
                                            type="button"
                                            key={link.value}
                                            initial={{ opacity: 0, x: 12 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.06 + i * 0.05, duration: 0.32 }}
                                            onClick={() => { onFilterChange(link.value); setMenuOpen(false); }}
                                            className="flex items-center justify-between py-4 text-left w-full"
                                            style={{ borderBottom: "1px solid rgba(245,240,232,0.05)" }}
                                        >
                                            <span style={{
                                                fontFamily: "'Noto Serif KR', serif",
                                                fontSize: "19px",
                                                fontWeight: isActive ? 700 : 400,
                                                color: isActive ? "#F5F0E8" : "rgba(245,240,232,0.4)",
                                                letterSpacing: "-0.01em",
                                                transition: "color 0.2s",
                                            }}>
                                                {link.label}
                                            </span>
                                            {isActive && (
                                                <span
                                                    className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: "#C9A96E" }}
                                                />
                                            )}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            {/* 패널 하단 - 로그인 */}
                            <div
                                className="px-6 py-5 shrink-0"
                                style={{ borderTop: "1px solid rgba(245,240,232,0.06)" }}
                            >
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-[10px] tracking-[0.12em] uppercase transition-colors duration-200"
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        color: "rgba(245,240,232,0.28)",
                                        fontWeight: 400,
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#C9A96E"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.28)"}
                                >
                                    로그인
                                    <ArrowRight size={10} strokeWidth={1.5} />
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
