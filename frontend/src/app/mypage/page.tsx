"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "@/components/main/Navigation";
import { Footer } from "@/components/main/Footer";
import { EventCard } from "@/components/main/EventCard";
import { Logo } from "@/components/common/Logo";
import { EventData } from "@/types/event";
import {
    User, Mail, LogOut, Save, ChevronDown,
    Bookmark, BookmarkX, ArrowLeft,
} from "lucide-react";

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";

const DIOCESES = [
    "서울대교구", "인천교구", "수원교구", "의정부교구", "춘천교구",
    "원주교구", "청주교구", "대전교구", "전주교구", "광주대교구",
    "제주교구", "대구대교구", "안동교구", "부산교구", "마산교구", "군종교구",
];

interface AuthUser { id: string; email: string; name: string; }

function readToken(): string | null {
    try { return localStorage.getItem("authToken"); } catch { return null; }
}
function readUser(): AuthUser | null {
    try {
        const raw = localStorage.getItem("authUser");
        return raw ? JSON.parse(raw) : null;
    } catch { return null; }
}

export default function MyPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [targetDiocese, setTargetDiocese] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [saving, setSaving] = useState(false);
    const [saveMsg, setSaveMsg] = useState<string | null>(null);

    const [bookmarks, setBookmarks] = useState<EventData[]>([]);
    const [bookLoading, setBookLoading] = useState(true);
    const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

    const [activeTab, setActiveTab] = useState<"profile" | "bookmarks">("profile");

    /* ?? ?증 ?인 ??????????????????????????????????????? */
    useEffect(() => {
        const u = readUser();
        if (!u) { router.replace("/login"); return; }
        setUser(u);
        setName(u.name || "");

        // ???보 (교구) ?버?서 가?오?
        const token = readToken();
        if (token) {
            fetch(`${API_BASE}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            })
                .then(r => r.json())
                .then(data => {
                    if (data.targetDiocese) setTargetDiocese(data.targetDiocese);
                })
                .catch(() => {});
        }
    }, [router]);

    /* ?? 즐겨찾기 로드 ??????????????????????????????????? */
    useEffect(() => {
        const token = readToken();
        if (!token) return;
        setBookLoading(true);
        fetch(`${API_BASE}/auth/me/bookmarks`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(r => r.json())
            .then((rows: any[]) => {
                const mapped: EventData[] = rows.map(e => ({
                    id: e.id,
                    title: e.title,
                    subtitle: e.category || "",
                    date: e.date ? new Date(e.date).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" }) : "날짜 미정",
                    rawDate: e.date || undefined,
                    location: e.location || "장소 미정",
                    category: e.category || "기타",
                    description: e.aiSummary || "",
                    aiSummary: e.aiSummary,
                    organizer: "Catholica",
                    duration: "상세참조",
                    tags: [],
                    featured: false,
                    originUrl: e.originUrl || "",
                    image: e.imageUrl || "",
                    latitude: e.latitude,
                    longitude: e.longitude,
                    createdAt: e.createdAt,
                }));
                setBookmarks(mapped);
                setBookmarkedIds(new Set(rows.map(e => e.id)));
            })
            .catch(() => {})
            .finally(() => setBookLoading(false));
    }, []);

    /* ?? ?로??????????????????????????????????????????? */
    const handleSave = async () => {
        const token = readToken();
        if (!token) return;
        setSaving(true); setSaveMsg(null);
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ name, targetDiocese: targetDiocese || null }),
            });
            const data = await res.json();
            if (!res.ok) { setSaveMsg("저장 실패: " + (data.message || "")); return; }

            // localStorage ?데?트
            const updated = { ...user!, name: data.name || name };
            localStorage.setItem("authUser", JSON.stringify(updated));
            setUser(updated);
            setSaveMsg("저장되었습니다 ✔");
            setTimeout(() => setSaveMsg(null), 2500);
        } catch {
            setSaveMsg("서버 연결 오류");
        } finally {
            setSaving(false);
        }
    };

    /* ?? 즐겨찾기 ?? ???????????????????????????????????? */
    const handleBookmarkToggle = async (eventId: string, current: boolean) => {
        const token = readToken();
        if (!token) return;

        // ????UI
        setBookmarkedIds(prev => {
            const next = new Set(prev);
            if (current) next.delete(eventId); else next.add(eventId);
            return next;
        });
        if (current) {
            setBookmarks(prev => prev.filter(e => e.id !== eventId));
        }

        await fetch(`${API_BASE}/auth/me/bookmarks/${eventId}`, {
            method: current ? "DELETE" : "POST",
            headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
    };

    /* ── 로그아웃 ──────────────────────────────────────────────────── */
    const handleLogout = () => {
        localStorage.removeItem("authToken");
        localStorage.removeItem("authUser");
        window.location.href = "/";
    };

    if (!user) return null;

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .mp-tab {
                    padding: 10px 20px; border: none; background: none; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; font-weight: 500;
                    color: #9C9891; border-bottom: 2px solid transparent;
                    transition: color 0.2s, border-color 0.2s;
                }
                .mp-tab.active { color: #0B2040; border-bottom-color: #0B2040; }
                .mp-input {
                    width: 100%; padding: 13px 16px;
                    border: 1.5px solid #E8E5DF; border-radius: 10px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                }
                .mp-input:focus { border-color: #0B2040; }
                .mp-select {
                    width: 100%; padding: 13px 16px;
                    border: 1.5px solid #E8E5DF; border-radius: 10px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; appearance: none;
                    cursor: pointer; transition: border-color 0.2s;
                }
                .mp-select:focus { border-color: #0B2040; }
                .bk-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                @media (max-width: 900px) { .bk-grid { grid-template-columns: repeat(2, 1fr); } }
                @media (max-width: 600px) { .bk-grid { grid-template-columns: 1fr; } }
            `}</style>

            <Navigation activeFilter="전체" onFilterChange={() => {}} onSearchOpen={() => {}} />

            <main style={{ backgroundColor: "#F8F7F4", minHeight: "100vh", paddingTop: "60px" }}>

                {/* ?? ?더 배너 ?? */}
                <div style={{ backgroundColor: "#0B2040", padding: "52px 0 0" }}>
                    <div className="sacred-rail">
                        {/* ?로가?*/}
                        <button
                            onClick={() => router.push("/")}
                            style={{
                                display: "inline-flex", alignItems: "center", gap: "6px",
                                background: "none", border: "none", cursor: "pointer",
                                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                                color: "rgba(255,255,255,0.45)", marginBottom: "28px",
                                transition: "color 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
                        >
                            <ArrowLeft size={14} /> 뒤로가기
                        </button>

                        {/* ?? ?보 */}
                        <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "36px" }}>
                            <div style={{
                                width: "64px", height: "64px", borderRadius: "50%",
                                backgroundColor: "#C9A96E",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                            }}>
                                <User size={28} color="#0B2040" />
                            </div>
                            <div>
                                <p style={{
                                    fontFamily: "'DM Mono', monospace", fontSize: "10px",
                                    letterSpacing: "0.2em", color: "#C9A96E", textTransform: "uppercase",
                                    marginBottom: "6px",
                                }}>My Account</p>
                                <h1 style={{
                                    fontFamily: "'Noto Serif KR', serif", fontWeight: 900,
                                    fontSize: "clamp(22px, 3vw, 32px)", color: "#FFFFFF",
                                    letterSpacing: "-0.03em",
                                }}>
                                    {user.name || user.email}
                                </h1>
                                <p style={{
                                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                                    color: "rgba(255,255,255,0.45)", marginTop: "4px",
                                }}>
                                    {user.email}
                                </p>
                            </div>
                        </div>

                        {/* ??*/}
                        <div style={{ display: "flex", gap: "0", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                            {[
                                { id: "profile", label: "프로필 설정" },
                                { id: "bookmarks", label: `즐겨찾기 ${bookmarks.length > 0 ? `(${bookmarks.length})` : ""}` },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    style={{
                                        padding: "12px 24px", border: "none", background: "none",
                                        cursor: "pointer",
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500,
                                        color: activeTab === tab.id ? "#FFFFFF" : "rgba(255,255,255,0.4)",
                                        borderBottom: activeTab === tab.id ? "2px solid #C9A96E" : "2px solid transparent",
                                        transition: "color 0.2s",
                                        marginBottom: "-1px",
                                    }}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ?? 콘텐??? */}
                <div className="sacred-rail" style={{ padding: "clamp(40px, 5vw, 64px) clamp(20px, 5vw, 72px)" }}>

                    {/* ?? ?로?????? */}
                    {activeTab === "profile" && (
                        <div style={{ maxWidth: "560px" }}>
                            <div style={{
                                backgroundColor: "#FFFFFF", borderRadius: "16px",
                                border: "1.5px solid #E8E5DF",
                                padding: "clamp(28px, 4vw, 40px)",
                                display: "flex", flexDirection: "column", gap: "24px",
                            }}>
                                {/* ?름 */}
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontFamily: "'DM Mono', monospace", fontSize: "10px",
                                        letterSpacing: "0.16em", color: "#52504B",
                                        textTransform: "uppercase", marginBottom: "8px",
                                    }}>이름</label>
                                    <input
                                        className="mp-input"
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        placeholder="이름을 입력하세요"
                                    />
                                </div>

                                {/* ?메??(?기?용) */}
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontFamily: "'DM Mono', monospace", fontSize: "10px",
                                        letterSpacing: "0.16em", color: "#52504B",
                                        textTransform: "uppercase", marginBottom: "8px",
                                    }}>이메일</label>
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "10px",
                                        padding: "13px 16px", backgroundColor: "#F8F7F4",
                                        border: "1.5px solid #E8E5DF", borderRadius: "10px",
                                    }}>
                                        <Mail size={14} color="#9C9891" />
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#52504B" }}>
                                            {user.email}
                                        </span>
                                    </div>
                                </div>

                                {/* 교구 ?택 */}
                                <div>
                                    <label style={{
                                        display: "block",
                                        fontFamily: "'DM Mono', monospace", fontSize: "10px",
                                        letterSpacing: "0.16em", color: "#52504B",
                                        textTransform: "uppercase", marginBottom: "8px",
                                    }}>관심교구</label>
                                    <div style={{ position: "relative" }}>
                                        <select
                                            className="mp-select"
                                            value={targetDiocese}
                                            onChange={e => setTargetDiocese(e.target.value)}
                                        >
                                            <option value="">교구를 선택하세요</option>
                                            {DIOCESES.map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={14} color="#9C9891" style={{
                                            position: "absolute", right: "14px", top: "50%",
                                            transform: "translateY(-50%)", pointerEvents: "none",
                                        }} />
                                    </div>
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                                        color: "#9C9891", marginTop: "6px", lineHeight: 1.6,
                                    }}>
                                        설정하면 해당 교구 행사를 우선 표시해드립니다
                                    </p>
                                </div>

                                {/* ???버튼 */}
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        style={{
                                            display: "inline-flex", alignItems: "center", gap: "8px",
                                            padding: "13px 28px",
                                            backgroundColor: saving ? "#9C9891" : "#0B2040",
                                            color: "#FFFFFF", border: "none", borderRadius: "10px",
                                            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                                            cursor: saving ? "not-allowed" : "pointer",
                                            transition: "background 0.2s",
                                        }}
                                    >
                                        <Save size={14} />
                                        {saving ? "저장 중.." : "저장하기"}
                                    </button>
                                    {saveMsg && (
                                        <span style={{
                                            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                                            color: saveMsg.includes("저장") ? "#1A6B40" : "#DC2626",
                                        }}>
                                            {saveMsg}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* 계정 관?*/}
                            <div style={{
                                marginTop: "16px",
                                backgroundColor: "#FFFFFF", borderRadius: "16px",
                                border: "1.5px solid #E8E5DF",
                                padding: "24px clamp(28px, 4vw, 40px)",
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                            }}>
                                <div>
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                                        fontWeight: 500, color: "#100F0F", marginBottom: "2px",
                                    }}>로그아웃</p>
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                                        color: "#9C9891",
                                    }}>모든 기기에서 로그아웃합니다</p>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    style={{
                                        display: "inline-flex", alignItems: "center", gap: "6px",
                                        padding: "10px 18px",
                                        backgroundColor: "transparent", color: "#DC2626",
                                        border: "1.5px solid #FECACA", borderRadius: "8px",
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500,
                                        cursor: "pointer", transition: "background 0.2s",
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
                                >
                                    <LogOut size={13} />
                                    로그아웃
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ?? 즐겨찾기 ???? */}
                    {activeTab === "bookmarks" && (
                        <div>
                            {bookLoading ? (
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: "80px 0",
                                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891",
                                }}>
                                    불러오는 중..
                                </div>
                            ) : bookmarks.length === 0 ? (
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    justifyContent: "center", padding: "80px 0", gap: "16px",
                                }}>
                                    <BookmarkX size={40} color="#D0CDC7" />
                                    <p style={{
                                        fontFamily: "'Noto Serif KR', serif", fontWeight: 700,
                                        fontSize: "18px", color: "#52504B",
                                    }}>
                                        즐겨찾기한 행사가 없습니다
                                    </p>
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                                        color: "#9C9891", textAlign: "center", lineHeight: 1.8,
                                    }}>
                                        행사 카드의 하트 버튼을 눌러 즐겨찾기를 추가하세요
                                    </p>
                                    <button
                                        onClick={() => router.push("/")}
                                        style={{
                                            marginTop: "8px", padding: "12px 24px",
                                            backgroundColor: "#0B2040", color: "#FFFFFF",
                                            border: "none", borderRadius: "10px",
                                            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                                            cursor: "pointer",
                                        }}
                                    >
                                        행사 둘러보기
                                    </button>
                                </div>
                            ) : (
                                <div className="bk-grid">
                                    {bookmarks.map((event, i) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            index={i}
                                            variant="grid"
                                            isBookmarked={bookmarkedIds.has(String(event.id))}
                                            onBookmarkToggle={handleBookmarkToggle}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </>
    );
}
