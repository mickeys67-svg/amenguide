import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Search } from "lucide-react";

interface NavigationProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onSearchOpen: () => void;
}

export function Navigation({ activeFilter, onFilterChange, onSearchOpen }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "피정", value: "피정" },
        { label: "강의", value: "강의" },
        { label: "강론", value: "강론" },
        { label: "특강", value: "특강" },
        { label: "피정의집", value: "피정의집" },
    ];

    return (
        <>
            <motion.nav
                className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
                style={{
                    backgroundColor: scrolled ? "rgba(8, 7, 5, 0.95)" : "transparent",
                    backdropFilter: scrolled ? "blur(12px)" : "none",
                    borderBottom: scrolled ? "1px solid rgba(201, 169, 110, 0.15)" : "none",
                }}
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
                <div className="sacred-rail">
                    <div className="flex items-center justify-between h-16 md:h-20">
                        {/* Logo */}
                        <div className="flex flex-col leading-none">
                            <span style={{ fontFamily: "'Playfair Display', serif", color: "#C9A96E", letterSpacing: "0.08em", fontSize: "11px" }}>
                                CATHOLICA
                            </span>
                            <span style={{ fontFamily: "'Noto Serif KR', serif", color: "#F5F0E8", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em" }}>
                                가톨릭 행사 허브
                            </span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <button
                                    type="button"
                                    key={link.value}
                                    onClick={() => onFilterChange(link.value === activeFilter ? "전체" : link.value)}
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        letterSpacing: "0.1em",
                                        color: activeFilter === link.value ? "#C9A96E" : "rgba(245, 240, 232, 0.6)",
                                        transition: "color 0.3s",
                                        fontWeight: activeFilter === link.value ? 600 : 400,
                                    }}
                                    className="hover:text-white uppercase relative group"
                                >
                                    {link.label}
                                    {activeFilter === link.value && (
                                        <motion.span
                                            layoutId="nav-indicator"
                                            className="absolute -bottom-1 left-0 right-0 h-px"
                                            style={{ backgroundColor: "#C9A96E" }}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                aria-label="검색"
                                onClick={onSearchOpen}
                                className="flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300"
                                style={{ border: "1px solid rgba(201, 169, 110, 0.4)", color: "#C9A96E" }}
                            >
                                <Search size={14} />
                            </button>

                            <button
                                type="button"
                                className="hidden md:block px-5 py-2 text-[11px] font-semibold tracking-[0.08em] uppercase border border-[#C9A96E]/50 text-[#C9A96E] hover:bg-[#C9A96E]/10 transition-colors cursor-pointer"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                }}
                            >
                                로그인
                            </button>

                            <button
                                type="button"
                                aria-label="메뉴 열기"
                                className="md:hidden flex items-center justify-center w-9 h-9"
                                style={{ color: "#F5F0E8" }}
                                onClick={() => setMenuOpen(true)}
                            >
                                <Menu size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex flex-col"
                        style={{ backgroundColor: "#080705" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex items-center justify-between px-6 h-16">
                            <span style={{ fontFamily: "'Noto Serif KR', serif", color: "#F5F0E8", fontSize: "18px", fontWeight: 700 }}>
                                가톨릭 행사 허브
                            </span>
                            <button type="button" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} style={{ color: "#F5F0E8" }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex flex-col items-center justify-center flex-1 gap-7">
                            {[{ label: "전체", value: "전체" }, ...navLinks].map((link, i) => (
                                <motion.button
                                    type="button"
                                    key={link.value}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08, duration: 0.5 }}
                                    onClick={() => { onFilterChange(link.value); setMenuOpen(false); }}
                                    style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        fontSize: "28px",
                                        fontWeight: 700,
                                        color: activeFilter === link.value ? "#C9A96E" : "rgba(245, 240, 232, 0.7)",
                                        letterSpacing: "-0.02em",
                                    }}
                                >
                                    {link.label}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
