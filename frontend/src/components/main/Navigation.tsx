"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogIn, LogOut, Compass, Map, User, Heart, FileText, Zap, Church } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";
import { lockBodyScroll, unlockBodyScroll } from "@/utils/bodyScrollLock";
import { useAuth } from "@/hooks/useAuth";
import dynamic from "next/dynamic";

const AiRecommendModal = dynamic(() => import("@/components/main/AiRecommendModal").then(m => m.AiRecommendModal), { ssr: false });

interface NavigationProps {
    activeFilter?: string;
    onFilterChange?: (filter: string) => void;
    onSearchOpen?: () => void;
    onAiRecommendOpen?: () => void;
}

// ── 반응형 breakpoint (Tailwind 신뢰 불가 → CSS 직접 제어) ──────────────
const NAV_STYLE = `
    .nav-desktop-links { display: flex; align-items: center; gap: 4px; }
    .nav-desktop-only  { display: inline; }
    .nav-login-btn      { display: flex; }
    .nav-hamburger      { display: none; }
    @media (max-width: 767px) {
        .nav-desktop-links { display: none; }
        .nav-desktop-only  { display: none; }
        .nav-login-btn      { display: none; }
        .nav-hamburger      { display: flex; }
    }

    /* ── 3D Flip Card ── */
    .flip-card {
        perspective: 800px;
        display: inline-flex;
    }
    .flip-card-inner {
        transition: transform 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        transform-style: preserve-3d;
        position: relative;
    }
    .flip-card:hover .flip-card-inner {
        transform: rotateX(180deg);
    }
    .flip-card-front,
    .flip-card-back {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
    }
    .flip-card-back {
        transform: rotateX(180deg);
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
    }
    /* 세실리아 버튼 내부 flip: 모바일에서는 플립 비활성 */
    @media (max-width: 767px) {
        .flip-card:hover .flip-card-inner {
            transform: none;
        }
    }

    @keyframes cecilia-breathe {
        0%, 100% {
            box-shadow: 0 0 8px rgba(201,169,110,0.15), 0 0 20px rgba(99,220,190,0.08), 0 2px 8px rgba(11,32,64,0.2);
        }
        50% {
            box-shadow: 0 0 16px rgba(201,169,110,0.3), 0 0 36px rgba(99,220,190,0.15), 0 2px 8px rgba(11,32,64,0.2);
        }
    }
    .cecilia-nav-btn {
        animation: cecilia-breathe 3s ease-in-out infinite;
    }
    .cecilia-nav-btn:hover {
        animation: none;
    }

    /* ── 세실리아 AI 원 — 살아있는 생명체 ── */
    @keyframes cecilia-orb-breathe {
        0%   { transform: scale(1);    box-shadow: 0 0 3px rgba(201,169,110,0.2), 0 0 6px rgba(99,220,190,0.1); }
        15%  { transform: scale(1.12); box-shadow: 0 0 8px rgba(201,169,110,0.4), 0 0 14px rgba(99,220,190,0.2); }
        30%  { transform: scale(1.04); box-shadow: 0 0 5px rgba(201,169,110,0.25), 0 0 10px rgba(14,165,233,0.15); }
        50%  { transform: scale(1.18); box-shadow: 0 0 12px rgba(201,169,110,0.55), 0 0 22px rgba(99,220,190,0.35), 0 0 32px rgba(14,165,233,0.18); }
        65%  { transform: scale(1.06); box-shadow: 0 0 6px rgba(99,220,190,0.3), 0 0 14px rgba(201,169,110,0.2); }
        80%  { transform: scale(1.10); box-shadow: 0 0 9px rgba(14,165,233,0.3), 0 0 18px rgba(201,169,110,0.25); }
        100% { transform: scale(1);    box-shadow: 0 0 3px rgba(201,169,110,0.2), 0 0 6px rgba(99,220,190,0.1); }
    }
    @keyframes cecilia-orb-spin {
        from { filter: hue-rotate(0deg); }
        to   { filter: hue-rotate(360deg); }
    }
    @keyframes cecilia-orb-pulse {
        0%, 100% { opacity: 0.7; }
        50%      { opacity: 1; }
    }
    .cecilia-orb {
        animation: cecilia-orb-breathe 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite,
                   cecilia-orb-spin 6s linear infinite,
                   cecilia-orb-pulse 2s ease-in-out infinite;
        will-change: transform, box-shadow, filter, opacity;
        transition: all 0.3s ease;
    }
    .cecilia-nav-btn:hover .cecilia-orb {
        animation: cecilia-orb-breathe 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite,
                   cecilia-orb-spin 2s linear infinite;
        opacity: 1;
        box-shadow: 0 0 16px rgba(201,169,110,0.6), 0 0 28px rgba(99,220,190,0.4), 0 0 40px rgba(14,165,233,0.2);
    }
`;

export function Navigation({ activeFilter, onFilterChange, onSearchOpen, onAiRecommendOpen }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [internalAiOpen, setInternalAiOpen] = useState(false);
    const router = useRouter();
    const { authUser, mounted, logout } = useAuth();

    // 외부에서 onAiRecommendOpen이 없으면 내부 모달 사용
    const handleAiOpen = onAiRecommendOpen ?? (() => setInternalAiOpen(true));

    useEffect(() => {
        let ticking = false;
        const onScroll = () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                setScrolled((prev) => {
                    const next = window.scrollY > 8;
                    return prev === next ? prev : next;
                });
                ticking = false;
            });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        if (menuOpen) lockBodyScroll(); else unlockBodyScroll();
        return () => { if (menuOpen) unlockBodyScroll(); };
    }, [menuOpen]);

    const handleLogout = () => {
        logout();
        setMenuOpen(false);
        router.push("/");
    };

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const offset = id === "events" ? 110 : 60;
            const y = el.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top: y, behavior: "smooth" });
        } else {
            // 홈이 아닌 페이지에서는 홈으로 이동 후 해당 섹션으로 스크롤
            router.push(`/#${id}`);
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
                    height: "72px",
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
                    <Logo
                        variant="dark"
                        size={64}
                        style={{ flexShrink: 0 }}
                        onClick={() => { onFilterChange?.("전체"); router.push("/"); }}
                    />

                    <div style={{ flex: 1 }} />

                    {/* ── 네비 콘텐츠 (hydration 후 fade-in) ── */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        opacity: mounted ? 1 : 0,
                        transition: "opacity 0.25s ease",
                    }}>

                    {/* ── 데스크탑 링크 (768px+) ── */}
                    <nav className="nav-desktop-links" aria-label="메인 내비게이션">
                        {/* 탐색 · 지도 */}
                        {[
                            { label: "탐색", id: "events", icon: <Compass size={13} strokeWidth={2} /> },
                            { label: "지도", id: "map",    icon: <Map size={13} strokeWidth={2} /> },
                        ].map(({ label, id, icon }) => (
                            <button
                                key={id}
                                type="button"
                                title={label}
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
                                {icon}{label}
                            </button>
                        ))}

                        {/* Cenaculum — 3D flip → 친교의 다락방 */}
                        <div className="flip-card">
                            <button
                                type="button"
                                title="친교의 다락방"
                                onClick={() => router.push("/community")}
                                style={{
                                    display: "flex", alignItems: "center", gap: "5px",
                                    fontFamily: "'DM Serif Display', serif",
                                    fontSize: "13px", fontWeight: 400, fontStyle: "italic",
                                    color: "#52504B", padding: "5px 14px",
                                    borderRadius: "6px", background: "transparent",
                                    border: "none", cursor: "pointer",
                                    transition: "color 0.15s ease, background 0.15s ease",
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
                                <Church size={13} strokeWidth={2} />
                                <span className="flip-card-inner">
                                    <span className="flip-card-front">Cenaculum</span>
                                    <span className="flip-card-back" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", fontStyle: "normal", fontWeight: 500 }}>
                                        친교의 다락방
                                    </span>
                                </span>
                            </button>
                        </div>

                        {/* 공지사항 */}
                        <button
                            type="button"
                            title="공지사항"
                            onClick={() => router.push("/notices")}
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
                            <FileText size={13} strokeWidth={2} />공지사항
                        </button>
                    </nav>

                    {/* ── Actions ── */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: "220px", justifyContent: "flex-end" }}>

                        {/* 세실리아 AI 상담 — 3D flip → AI 마음치료사 */}
                        <div className="flip-card">
                            <button
                                type="button"
                                aria-label="AI 마음 상담"
                                title="세실리아 AI 영성 상담 — 마음을 나누면 맞춤 행사와 성가를 추천해 드립니다"
                                onClick={handleAiOpen}
                                className="cecilia-nav-btn"
                                style={{
                                    display: "flex", alignItems: "center", gap: "6px",
                                    padding: "7px 14px", borderRadius: "20px",
                                    border: "none",
                                    background: "linear-gradient(135deg, #0B2040 0%, #1E3A5F 100%)",
                                    color: "#FFFFFF", cursor: "pointer",
                                    transition: "background 0.25s ease, box-shadow 0.25s ease",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "12.5px", fontWeight: 600,
                                    position: "relative",
                                    overflow: "visible",
                                    boxShadow: "0 2px 8px rgba(11,32,64,0.2)",
                                }}
                                onMouseEnter={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.background = "linear-gradient(135deg, #1E3A5F 0%, #2A5080 100%)";
                                    el.style.boxShadow = "0 4px 16px rgba(11,32,64,0.3)";
                                }}
                                onMouseLeave={e => {
                                    const el = e.currentTarget as HTMLElement;
                                    el.style.background = "linear-gradient(135deg, #0B2040 0%, #1E3A5F 100%)";
                                    el.style.boxShadow = "0 2px 8px rgba(11,32,64,0.2)";
                                }}
                            >
                                <span className="cecilia-orb" style={{
                                    width: "16px", height: "16px", borderRadius: "50%",
                                    background: "conic-gradient(from 180deg, #C9A96E, #63DCBE, #0EA5E9, #C9A96E)",
                                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                                    flexShrink: 0,
                                }}>
                                    <span style={{
                                        width: "8px", height: "8px", borderRadius: "50%",
                                        backgroundColor: "#0B2040",
                                    }} />
                                </span>
                                <span className="nav-desktop-only flip-card-inner" style={{ display: "inline-flex", height: "18px", lineHeight: "18px" }}>
                                    <span className="flip-card-front">세실리아</span>
                                    <span className="flip-card-back" style={{ fontSize: "11.5px", whiteSpace: "nowrap" }}>AI 마음치료사</span>
                                </span>
                                <span style={{
                                    fontSize: "9px", fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    backgroundColor: "rgba(255,255,255,0.15)",
                                    color: "rgba(255,255,255,0.9)",
                                    letterSpacing: "0.04em",
                                    fontFamily: "'DM Mono', monospace",
                                    lineHeight: "1.4",
                                }}>AI</span>
                            </button>
                        </div>

                        {/* 검색 아이콘 */}
                        <button
                            type="button"
                            aria-label="검색"
                            onClick={() => onSearchOpen?.()}
                            style={{
                                width: "44px", height: "44px",
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

                        {/* ── 로그인 / 로그아웃 (768px+) ── */}
                        {authUser ? (
                            /* 로그인 상태: 마이페이지 버튼 + 로그아웃 버튼 */
                            <div className="nav-login-btn" style={{ alignItems: "center", gap: "8px" }}>
                                <button
                                    type="button"
                                    onClick={() => router.push("/mypage")}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "6px",
                                        padding: "5px 12px", borderRadius: "8px",
                                        backgroundColor: "rgba(11,32,64,0.06)",
                                        border: "none", cursor: "pointer",
                                        transition: "background 0.15s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(11,32,64,0.1)"}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(11,32,64,0.06)"}
                                >
                                    <User size={13} strokeWidth={2} color="#0B2040" />
                                    <span style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px", fontWeight: 500,
                                        color: "#0B2040", maxWidth: "80px",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                    }}>
                                        {authUser.name}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    style={{
                                        display: "flex", alignItems: "center", gap: "5px",
                                        padding: "7px 12px", borderRadius: "8px",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px", fontWeight: 500,
                                        backgroundColor: "transparent", color: "#9C9891",
                                        border: "1.5px solid #E8E5DF", cursor: "pointer",
                                        transition: "all 0.15s ease",
                                    }}
                                    onMouseEnter={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.borderColor = "#DC2626";
                                        el.style.color = "#DC2626";
                                    }}
                                    onMouseLeave={e => {
                                        const el = e.currentTarget as HTMLElement;
                                        el.style.borderColor = "#E8E5DF";
                                        el.style.color = "#9C9891";
                                    }}
                                >
                                    <LogOut size={13} strokeWidth={2} />
                                    로그아웃
                                </button>
                            </div>
                        ) : (
                            /* 비로그인 상태: 로그인 버튼 */
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
                        )}

                        {/* 햄버거 (모바일 ~767px) */}
                        <button
                            type="button"
                            aria-label="메뉴 열기"
                            onClick={() => setMenuOpen(true)}
                            className="nav-hamburger"
                            style={{
                                width: "44px", height: "44px",
                                alignItems: "center", justifyContent: "center",
                                color: "#100F0F", border: "none",
                                backgroundColor: "transparent", cursor: "pointer",
                                borderRadius: "8px",
                            }}
                        >
                            <Menu size={19} strokeWidth={1.8} />
                        </button>
                    </div>
                    </div>{/* hydration wrapper 닫힘 */}
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
                                position: "fixed", top: "72px", left: 0, right: 0, zIndex: 100,
                                backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E5DF",
                                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                                padding: "8px 0 16px",
                                maxHeight: "calc(100vh - 72px)", overflowY: "auto",
                            }}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                        >
                            <div className="sacred-rail">
                                {/* 세실리아 AI 상담 (모바일) */}
                                <button
                                    type="button"
                                    onClick={() => { setMenuOpen(false); handleAiOpen(); }}
                                    style={{
                                        width: "100%", display: "flex", alignItems: "center",
                                        justifyContent: "space-between",
                                        padding: "14px 0",
                                        border: "none", borderBottomWidth: "1px",
                                        borderBottomStyle: "solid", borderBottomColor: "#F0EFE9",
                                        background: "none", cursor: "pointer",
                                        textAlign: "left",
                                    }}
                                >
                                    <span style={{
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
                                        color: "#0B2040", fontWeight: 600,
                                        display: "flex", alignItems: "center", gap: "8px",
                                    }}>
                                        <span className="cecilia-orb" style={{
                                            display: "inline-flex", alignItems: "center", justifyContent: "center",
                                            width: "24px", height: "24px", borderRadius: "50%",
                                            background: "conic-gradient(from 180deg, #C9A96E, #63DCBE, #0EA5E9, #C9A96E)",
                                            padding: "2px",
                                        }}>
                                            <span style={{
                                                width: "14px", height: "14px", borderRadius: "50%",
                                                backgroundColor: "#FFFFFF",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}>
                                                <span style={{
                                                    width: "6px", height: "6px", borderRadius: "50%",
                                                    background: "conic-gradient(from 0deg, #C9A96E, #63DCBE, #0EA5E9, #C9A96E)",
                                                }} />
                                            </span>
                                        </span>
                                        세실리아
                                        <span style={{
                                            fontSize: "9px", fontWeight: 700,
                                            padding: "2px 6px",
                                            borderRadius: "4px",
                                            backgroundColor: "rgba(11,32,64,0.06)",
                                            color: "#0B2040",
                                            letterSpacing: "0.04em",
                                            fontFamily: "'DM Mono', monospace",
                                        }}>AI</span>
                                    </span>
                                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891" }}>
                                        영성 상담 · 행사 추천
                                    </span>
                                </button>

                                {[
                                    { label: "탐색", id: "events", desc: "카테고리별 행사 탐색", href: undefined as string | undefined },
                                    { label: "지도", id: "map",    desc: "지도에서 주변 행사 찾기", href: undefined as string | undefined },
                                    { label: "Cenaculum", id: "cenaculum", desc: "친교의 다락방", href: "/community" as string | undefined },
                                    { label: "공지사항", id: "notices", desc: "공지사항 게시판", href: "/notices" as string | undefined },
                                ].map(({ label, id, desc, href }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => { if (href) { router.push(href); setMenuOpen(false); } else { scrollTo(id); } }}
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

                                {/* 모바일 로그인/로그아웃 */}
                                <div style={{ display: "flex", gap: "8px", marginTop: "14px" }}>
                                    {authUser ? (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => { router.push("/mypage"); setMenuOpen(false); }}
                                                style={{
                                                    flex: 1, padding: "12px", borderRadius: "8px",
                                                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500,
                                                    backgroundColor: "rgba(11,32,64,0.06)", color: "#0B2040",
                                                    border: "none", cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                                }}
                                            >
                                                <User size={13} strokeWidth={2} />
                                                {authUser.name} · 마이페이지
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleLogout}
                                                style={{
                                                    padding: "12px 16px", borderRadius: "8px",
                                                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                                                    backgroundColor: "transparent", color: "#DC2626",
                                                    border: "1.5px solid #FECACA", cursor: "pointer",
                                                    display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                                                }}
                                            >
                                                <LogOut size={14} strokeWidth={2} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* 외부 핸들러 없을 때 내부 모달 */}
            {!onAiRecommendOpen && (
                <AiRecommendModal isOpen={internalAiOpen} onClose={() => setInternalAiOpen(false)} />
            )}
        </>
    );
}
