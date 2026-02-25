"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavigationProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onSearchOpen: () => void;
}

const CATS = ["피정", "강의", "강론", "특강", "피정의집"];

export function Navigation({ activeFilter, onFilterChange, onSearchOpen }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    return (
        <>
            <nav
                style={{
                    position: "fixed",
                    top: 0, left: 0, right: 0,
                    zIndex: 50,
                    height: "60px",
                    backgroundColor: "#FFFFFF",
                    borderBottom: `1px solid ${scrolled ? "#E8E5DF" : "transparent"}`,
                    boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.07)" : "none",
                    transition: "border-color 0.25s ease, box-shadow 0.25s ease",
                }}
            >
                <div className="sacred-rail h-full flex items-center gap-6">

                    {/* ── Logo ── */}
                    <button
                        type="button"
                        onClick={() => onFilterChange("전체")}
                        className="flex items-center gap-2.5 shrink-0"
                    >
                        <svg width="17" height="21" viewBox="0 0 17 21" fill="none">
                            <rect x="7" y="0" width="3" height="21" rx="1.5" fill="#0B2040" />
                            <rect x="0" y="4.5" width="17" height="3" rx="1.5" fill="#0B2040" />
                        </svg>
                        <div>
                            <span style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "15.5px",
                                fontWeight: 700,
                                color: "#0B2040",
                                letterSpacing: "0.12em",
                                display: "block",
                                lineHeight: 1,
                            }}>
                                CATHOLICA
                            </span>
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "9px",
                                color: "#9C9891",
                                letterSpacing: "0.04em",
                                display: "block",
                                marginTop: "3px",
                                lineHeight: 1,
                            }}>
                                가톨릭 행사 허브
                            </span>
                        </div>
                    </button>

                    {/* ── Spacer ── */}
                    <div style={{ flex: 1 }} />

                    {/* ── Desktop nav links ── */}
                    <nav className="hidden md:flex items-center gap-0.5" aria-label="카테고리 탐색">
                        {CATS.map((cat) => {
                            const active = activeFilter === cat;
                            return (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => onFilterChange(active ? "전체" : cat)}
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13.5px",
                                        fontWeight: active ? 600 : 400,
                                        color: active ? "#0B2040" : "#52504B",
                                        padding: "5px 14px",
                                        borderRadius: "6px",
                                        background: active ? "rgba(11,32,64,0.07)" : "transparent",
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={e => {
                                        if (!active) {
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.color = "#0B2040";
                                            el.style.background = "rgba(11,32,64,0.05)";
                                        }
                                    }}
                                    onMouseLeave={e => {
                                        if (!active) {
                                            const el = e.currentTarget as HTMLElement;
                                            el.style.color = "#52504B";
                                            el.style.background = "transparent";
                                        }
                                    }}
                                >
                                    {cat}
                                </button>
                            );
                        })}
                    </nav>

                    {/* ── Actions ── */}
                    <div className="flex items-center gap-1.5">
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={onSearchOpen}
                            style={{
                                width: "36px", height: "36px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "8px",
                                color: "#52504B",
                                transition: "all 0.15s ease",
                            }}
                            onMouseEnter={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = "rgba(11,32,64,0.06)";
                                el.style.color = "#0B2040";
                            }}
                            onMouseLeave={e => {
                                const el = e.currentTarget as HTMLElement;
                                el.style.background = "transparent";
                                el.style.color = "#52504B";
                            }}
                        >
                            <Search size={16} strokeWidth={2} />
                        </button>

                        <button
                            type="button"
                            onClick={() => router.push("/admin")}
                            className="hidden md:block px-4 py-2 rounded-lg text-[13px] font-semibold transition-all"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                backgroundColor: "#0B2040",
                                color: "#FFFFFF",
                                letterSpacing: "0.01em",
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#183568"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#0B2040"}
                        >
                            행사 등록
                        </button>

                        <button
                            type="button"
                            aria-label="메뉴 열기"
                            onClick={() => setMenuOpen(true)}
                            className="md:hidden"
                            style={{
                                width: "36px", height: "36px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#100F0F",
                            }}
                        >
                            <Menu size={19} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Drawer ── */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            className="fixed inset-0 z-[99]"
                            style={{ backgroundColor: "rgba(0,0,0,0.25)", backdropFilter: "blur(4px)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setMenuOpen(false)}
                        />

                        <motion.div
                            className="fixed top-0 right-0 bottom-0 z-[100] bg-white flex flex-col"
                            style={{ width: "min(280px, 85vw)", borderLeft: "1px solid #E8E5DF" }}
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                        >
                            {/* Drawer header */}
                            <div
                                className="flex items-center justify-between px-5"
                                style={{ height: "60px", borderBottom: "1px solid #E8E5DF", flexShrink: 0 }}
                            >
                                <span style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    fontSize: "15px",
                                    fontWeight: 700,
                                    color: "#0B2040",
                                    letterSpacing: "0.12em",
                                }}>
                                    CATHOLICA
                                </span>
                                <button
                                    type="button"
                                    aria-label="메뉴 닫기"
                                    onClick={() => setMenuOpen(false)}
                                    style={{ color: "#9C9891" }}
                                >
                                    <X size={17} />
                                </button>
                            </div>

                            {/* Links */}
                            <div className="flex flex-col flex-1 overflow-y-auto px-4 pt-2">
                                {[{ label: "전체 행사", value: "전체" }, ...CATS.map(c => ({ label: c, value: c }))].map((item, i) => (
                                    <motion.button
                                        key={item.value}
                                        type="button"
                                        initial={{ opacity: 0, x: 8 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.04 }}
                                        onClick={() => { onFilterChange(item.value); setMenuOpen(false); }}
                                        className="flex items-center justify-between py-4"
                                        style={{
                                            borderBottom: "1px solid #E8E5DF",
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "15px",
                                            color: activeFilter === item.value ? "#0B2040" : "#52504B",
                                            fontWeight: activeFilter === item.value ? 600 : 400,
                                        }}
                                    >
                                        {item.label}
                                        {activeFilter === item.value && (
                                            <span style={{
                                                width: "6px", height: "6px",
                                                borderRadius: "50%",
                                                backgroundColor: "#0B2040",
                                                display: "block",
                                            }} />
                                        )}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Footer CTA */}
                            <div className="px-4 pb-6 pt-4" style={{ borderTop: "1px solid #E8E5DF" }}>
                                <button
                                    type="button"
                                    onClick={() => { router.push("/admin"); setMenuOpen(false); }}
                                    className="w-full py-3 rounded-lg text-[14px] font-semibold"
                                    style={{
                                        backgroundColor: "#0B2040",
                                        color: "#FFFFFF",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                    }}
                                >
                                    행사 등록하기
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
