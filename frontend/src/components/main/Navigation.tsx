"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, X, LogIn, LogOut, Compass, Map, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/common/Logo";

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

interface AuthUser {
    id: string;
    email: string;
    name: string;
}

function readAuthUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem("authUser");
        if (!raw) return null;
        return JSON.parse(raw) as AuthUser;
    } catch {
        return null;
    }
}

export function Navigation({ activeFilter, onFilterChange, onSearchOpen }: NavigationProps) {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const router = useRouter();

    // 마운트 시 + storage 이벤트 시 auth 상태 갱신
    useEffect(() => {
        setAuthUser(readAuthUser());

        const onStorage = (e: StorageEvent) => {
            if (e.key === "authUser" || e.key === "authToken" || e.key === null) {
                setAuthUser(readAuthUser());
            }
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 8);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => {
        document.body.style.overflow = menuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [menuOpen]);

    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        setAuthUser(null);
        setMenuOpen(false);
        router.push("/");
    };

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
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
                        onClick={() => { onFilterChange("전체"); router.push("/"); }}
                    />

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

                        {/* 검색 아이콘 */}
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
        </>
    );
}
