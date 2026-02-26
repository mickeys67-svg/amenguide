"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogIn, Compass, Map } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavigationProps {
    activeFilter: string;
    onFilterChange: (filter: string) => void;
    onSearchOpen: () => void;
}

// ── 반응형 breakpoint (Tailwind 신뢰 불가 → CSS 직접 제어) ──────────────
const NAV_STYLE = `
    .nav-desktop-links { display: flex; align-items: center; gap: 4px; }
    .nav-login-btn      { display: flex; }
    .nav-hamburger      { display: none; }
    @media (max-width: 767px) {
        .nav-desktop-links { display: none; }
        .nav-login-btn      { display: none; }
        .nav-hamburger      { display: flex; }
    }
`;

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

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            // nav(60px) + FilterBar(~50px) 오프셋 적용 — scrollIntoView는 sticky bar 무시
            const offset = id === "events" ? 110 : 60;
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: "smooth" });
        }
        setMenuOpen(false);
    };

    return (
        <>
            <style>{NAV_STYLE}</style>

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
                <div
                    className="sacred-rail"
                    style={{ height: "100%", display: "flex", alignItems: "center", gap: "24px" }}
                >
                    {/* ── Logo ── */}
                    <button
                        type="button"
                        onClick={() => { onFilterChange("전체"); router.push("/"); }}
                        style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0, border: "none", background: "none", cursor: "pointer" }}
                    >
                        <svg width="17" height="21" viewBox="0 0 17 21" fill="none">
                            <rect x="7" y="0" width="3" height="21" rx="1.5" fill="#0B2040" />
                            <rect x="0" y="4.5" width="17" height="3" rx="1.5" fill="#0B2040" />
                        </svg>
                        <div>
                            <span style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "15.5px", fontWeight: 700,
                                color: "#0B2040", letterSpacing: "0.12em",
                                display: "block", lineHeight: 1,
                            }}>CATHOLICA</span>
                            <span style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "9px", color: "#9C9891",
                                letterSpacing: "0.04em", display: "block",
                                marginTop: "3px", lineHeight: 1,
                            }}>가톨릭 행사 허브</span>
                        </div>
                    </button>

                    <div style={{ flex: 1 }} />

                    {/* ── 데스크탑 링크 (768px+) ── */}
                    <nav className="nav-desktop-links" aria-label="메인 내비게이션">
                        {[
                            { label: "탐색", id: "events", icon: <Compass size={13} strokeWidth={2} /> },
                            { label: "지도", id: "map",    icon: <Map size={13} strokeWidth={2} /> },
                        ].map(({ label, id, icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => scrollTo(id)}
                                style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "13.5px", fontWeight: 400,
                                    color: "#52504B", padding: "5px 14px",
                                    borderRadius: "6px", background: "transparent",
                                    border: "none", cursor: "pointer",
                                    transition: "all 0.15s ease",
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = "#0B2040";
                                    el.style.background = "rgba(11,32,64,0.05)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.color = "#52504B";
                                    el.style.background = "transparent";
                                }}
                            >
                                {icon}
                                {label}
                            </button>
                        ))}
                    </nav>

                    {/* ── Actions ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>

                        {/* 검색 아이콘 (전체 사이즈 노출) */}
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={onSearchOpen}
                            style={{
                                width: "36px", height: "36px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                borderRadius: "8px", border: "none",
                                backgroundColor: "transparent", color: "#52504B",
                                cursor: "pointer", transition: "all 0.15s ease",
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

                        {/* 로그인 (768px+) */}
                        <button
                            type="button"
                            onClick={() => router.push("/login")}
                            className="nav-login-btn"
                            style={{
                                alignItems: "center", gap: "6px",
                                padding: "7px 16px", borderRadius: "8px",
                                fontFamily: "'Noto Sans KR', sans-serif",
                                fontSize: "13px", fontWeight: 600,
                                backgroundColor: "#0B2040", color: "#FFFFFF",
                                border: "none", cursor: "pointer",
                                transition: "background 0.15s ease",
                                letterSpacing: "0.01em",
                            }}
                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#183568"}
                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#0B2040"}
                        >
                            <LogIn size={13} strokeWidth={2} />
                            로그인
                        </button>

                        {/* 햄버거 (모바일 ~767px) */}
                        <button
                            type="button"
                            aria-label="메뉴 열기"
                            onClick={() => setMenuOpen(true)}
                            className="nav-hamburger"
                            style={{
                                width: "36px", height: "36px",
                                alignItems: "center", justifyContent: "center",
                                color: "#100F0F", border: "none",
                                backgroundColor: "transparent", cursor: "pointer",
                                borderRadius: "8px",
                            }}
                        >
                            <Menu size={19} strokeWidth={1.8} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── 모바일 드롭다운 ── */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            style={{ position: "fixed", inset: 0, zIndex: 99, backgroundColor: "rgba(0,0,0,0.2)" }}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            style={{
                                position: "fixed", top: "60px", left: 0, right: 0, zIndex: 100,
                                backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E5DF",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                padding: "8px 0 16px",
                            }}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                            <div className="sacred-rail">
                                {[
                                    { label: "탐색", id: "events", desc: "카테고리별 행사 탐색" },
                                    { label: "지도", id: "map",    desc: "지도에서 주변 행사 찾기" },
                                ].map(({ label, id, desc }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => scrollTo(id)}
                                        style={{
                                            width: "100%", display: "flex", alignItems: "center",
                                            justifyContent: "space-between",
                                            padding: "14px 0",
                                            borderBottom: "1px solid #F0EFE9",
                                            border: "none", borderBottomWidth: "1px",
                                            borderBottomStyle: "solid", borderBottomColor: "#F0EFE9",
                                            background: "none", cursor: "pointer",
                                            textAlign: "left",
                                        }}
                                    >
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px", color: "#100F0F", fontWeight: 500 }}>
                                            {label}
                                        </span>
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891" }}>
                                            {desc}
                                        </span>
                                    </button>
                                ))}
                                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                                    <button
                                        type="button"
                                        onClick={() => { router.push("/login"); setMenuOpen(false); }}
                                        style={{
                                            flex: 1, padding: "12px", borderRadius: "8px",
                                            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                                            backgroundColor: "#0B2040", color: "#FFFFFF",
                                            border: "none", cursor: "pointer",
                                        }}
                                    >로그인</button>
                                    <button
                                        type="button"
                                        onClick={() => { router.push("/register"); setMenuOpen(false); }}
                                        style={{
                                            flex: 1, padding: "12px", borderRadius: "8px",
                                            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 400,
                                            backgroundColor: "transparent", color: "#0B2040",
                                            border: "1.5px solid #D0CDC7", cursor: "pointer",
                                        }}
                                    >회원가입</button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
