"use client";

import { useState } from "react";
import { Check, AlertCircle, Shield, PlusCircle, RotateCcw, Calendar, MapPin, Link, FileText, Palette, Tag } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://amenguide-backend-wcnovu4ydq-uw.a.run.app";

const CATEGORIES = ["피정", "미사", "강의", "순례", "청년", "문화", "선교", "기타"];

const THEME_COLORS = [
    { label: "딥 블루",    value: "#1B4080" },
    { label: "퍼플",      value: "#6E2882" },
    { label: "포레스트",   value: "#1A6B40" },
    { label: "버밀리언",   value: "#C83A1E" },
    { label: "틸",        value: "#0B6B70" },
    { label: "바이올렛",   value: "#7C3AED" },
    { label: "골드",      value: "#C9A96E" },
    { label: "네이비",     value: "#0B2040" },
];

const EMPTY_FORM = {
    title: "", date: "", location: "", category: "피정",
    aiSummary: "", themeColor: "#1B4080", originUrl: "",
};

type StatusMsg = { type: "success" | "error"; msg: string; title?: string } | null;

export default function AdminPage() {
    const [adminKey, setAdminKey] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [status, setStatus] = useState<StatusMsg>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<{ title: string; time: string }[]>([]);

    const set = (key: keyof typeof EMPTY_FORM) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }));

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminKey.trim()) setAuthenticated(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) { setStatus({ type: "error", msg: "행사 제목은 필수입니다." }); return; }
        setLoading(true); setStatus(null);
        try {
            const res = await fetch(`${API_BASE}/events/admin/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
                body: JSON.stringify({ ...form, date: form.date || undefined }),
            });
            if (res.ok) {
                const data = await res.json();
                setStatus({ type: "success", msg: "행사가 성공적으로 등록되었습니다.", title: data.title });
                setHistory(h => [{ title: data.title, time: new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) }, ...h.slice(0, 9)]);
                setForm({ ...EMPTY_FORM });
            } else {
                const err = await res.json();
                setStatus({ type: "error", msg: err.message ?? `오류 ${res.status}: ${res.statusText}` });
            }
        } catch (err) {
            setStatus({ type: "error", msg: `네트워크 오류: ${(err as Error).message}` });
        } finally {
            setLoading(false);
        }
    };

    // ── 인증 화면 ─────────────────────────────────────────────────────────
    if (!authenticated) {
        return (
            <>
                <style>{`* { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
                <div style={{ minHeight: "100vh", backgroundColor: "#0B2040", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                        {/* 로고 */}
                        <div style={{ textAlign: "center", marginBottom: "40px" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                                <Logo variant="light" size={40} />
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" }}>Admin Panel</p>
                            <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "24px", color: "#FFFFFF", letterSpacing: "-0.02em", marginTop: "8px" }}>관리자 인증</h1>
                        </div>

                        <form onSubmit={handleAuth} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", padding: "32px" }}>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, marginBottom: "10px" }}>
                                관리자 키
                            </label>
                            <input
                                type="password"
                                value={adminKey}
                                onChange={e => setAdminKey(e.target.value)}
                                placeholder="ADMIN_API_KEY"
                                autoFocus
                                style={{ width: "100%", padding: "14px 16px", backgroundColor: "rgba(255,255,255,0.08)", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: "12px", color: "#FFFFFF", fontFamily: "'DM Mono', monospace", fontSize: "14px", outline: "none", letterSpacing: "0.05em", marginBottom: "20px" }}
                            />
                            <button
                                type="submit"
                                style={{ width: "100%", padding: "14px", backgroundColor: "#C9A96E", color: "#0B2040", border: "none", borderRadius: "12px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
                            >
                                <Shield size={15} /> 인증하기
                            </button>
                        </form>

                        <p style={{ textAlign: "center", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "24px", fontWeight: 300 }}>
                            이 페이지는 관리자 전용입니다.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    // ── 메인 어드민 패널 ──────────────────────────────────────────────────
    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .adm-input {
                    width: 100%; padding: 13px 16px 13px 44px;
                    border: 1.5px solid #E8E5DF; border-radius: 10px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                }
                .adm-input.no-icon { padding-left: 16px; }
                .adm-input:focus { border-color: #0B2040; }
                .adm-input::placeholder { color: #9C9891; }
                .adm-textarea {
                    width: 100%; padding: 13px 16px; min-height: 100px;
                    border: 1.5px solid #E8E5DF; border-radius: 10px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; resize: vertical; line-height: 1.7; transition: border-color 0.2s;
                }
                .adm-textarea:focus { border-color: #0B2040; }
                .adm-textarea::placeholder { color: #9C9891; }
                .adm-label { display: block; font-family: 'DM Mono', monospace; font-size: 10px; letter-spacing: 0.16em; color: #52504B; text-transform: uppercase; margin-bottom: 7px; }
                .adm-layout { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
                @media (max-width: 900px) { .adm-layout { grid-template-columns: 1fr; } .adm-sidebar { display: none; } }
                .field-wrap { position: relative; }
                .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9C9891; pointer-events: none; }
                @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                .slide-in { animation: slideIn 0.3s ease; }
            `}</style>

            <div className="adm-layout">

                {/* ── 사이드바 ──────────────────────────────── */}
                <aside className="adm-sidebar" style={{ backgroundColor: "#0B2040", display: "flex", flexDirection: "column", padding: "36px 28px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>

                    {/* 헤더 */}
                    <div style={{ marginBottom: "40px" }}>
                        <Logo variant="light" size={26} showSubtitle={false} />
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#C9A96E", textTransform: "uppercase" as const }}>Admin Panel</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "17px", color: "#FFFFFF", marginTop: "6px" }}>관리자 패널</h2>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.4)", marginTop: "3px", fontWeight: 300 }}>행사 관리 시스템</p>
                        </div>
                    </div>

                    {/* 메뉴 */}
                    <nav style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "auto" }}>
                        {[
                            { icon: <PlusCircle size={15} />, label: "행사 등록", active: true },
                        ].map(item => (
                            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", backgroundColor: item.active ? "rgba(201,169,110,0.12)" : "transparent", cursor: "pointer" }}>
                                <span style={{ color: item.active ? "#C9A96E" : "rgba(255,255,255,0.4)" }}>{item.icon}</span>
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: item.active ? "#FFFFFF" : "rgba(255,255,255,0.5)", fontWeight: item.active ? 500 : 300 }}>{item.label}</span>
                            </div>
                        ))}
                    </nav>

                    {/* 최근 등록 히스토리 */}
                    {history.length > 0 && (
                        <div style={{ paddingTop: "24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: "12px" }}>최근 등록</p>
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                                {history.map((h, i) => (
                                    <div key={i} style={{ padding: "10px 12px", backgroundColor: "rgba(255,255,255,0.04)", borderRadius: "8px", borderLeft: "2px solid rgba(201,169,110,0.4)" }}>
                                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.7)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.title}</p>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.3)", marginTop: "3px" }}>{h.time}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 로그아웃 */}
                    <button
                        onClick={() => setAuthenticated(false)}
                        style={{ marginTop: "24px", padding: "11px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", cursor: "pointer", textAlign: "left" as const }}
                    >
                        ← 로그아웃
                    </button>
                </aside>

                {/* ── 메인 콘텐츠 ──────────────────────────── */}
                <main style={{ backgroundColor: "#F8F7F4", padding: "clamp(24px, 4vw, 48px)", overflowY: "auto" }}>

                    {/* 페이지 헤더 */}
                    <div style={{ marginBottom: "32px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "8px" }}>New Event</p>
                        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(22px, 3vw, 32px)", color: "#100F0F", letterSpacing: "-0.03em" }}>행사 수동 등록</h1>
                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>가톨릭 행사를 직접 데이터베이스에 추가합니다.</p>
                    </div>

                    {/* 상태 메시지 */}
                    {status && (
                        <div className="slide-in" style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "16px 20px", borderRadius: "12px", marginBottom: "28px", backgroundColor: status.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${status.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
                            <div style={{ color: status.type === "success" ? "#16A34A" : "#DC2626", flexShrink: 0, marginTop: "1px" }}>
                                {status.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
                            </div>
                            <div>
                                {status.title && <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, color: status.type === "success" ? "#15803D" : "#B91C1C", marginBottom: "2px" }}>"{status.title}"</p>}
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: status.type === "success" ? "#166534" : "#991B1B", fontWeight: 300 }}>{status.msg}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                            {/* 섹션: 기본 정보 */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <FileText size={14} color="#9C9891" />
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const }}>기본 정보</span>
                                </div>

                                {/* 제목 */}
                                <div>
                                    <label className="adm-label">행사 제목 *</label>
                                    <div className="field-wrap">
                                        <FileText size={15} className="field-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="adm-input" type="text" placeholder="예: 2026 봄 피정 프로그램" value={form.title} onChange={set("title")} required />
                                    </div>
                                </div>

                                {/* 카테고리 + 날짜 */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                                    <div>
                                        <label className="adm-label">카테고리</label>
                                        <div className="field-wrap">
                                            <Tag size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                            <select className="adm-input" value={form.category} onChange={set("category")} style={{ appearance: "none", cursor: "pointer" }}>
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="adm-label">날짜·시간</label>
                                        <div className="field-wrap">
                                            <Calendar size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                            <input className="adm-input" type="datetime-local" value={form.date} onChange={set("date")} />
                                        </div>
                                    </div>
                                </div>

                                {/* 장소 */}
                                <div>
                                    <label className="adm-label">장소</label>
                                    <div className="field-wrap">
                                        <MapPin size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="adm-input" type="text" placeholder="예: 서울 명동대성당" value={form.location} onChange={set("location")} />
                                    </div>
                                </div>
                            </div>

                            {/* 섹션: 추가 정보 */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "28px", display: "flex", flexDirection: "column", gap: "18px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                                    <FileText size={14} color="#9C9891" />
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const }}>추가 정보</span>
                                </div>

                                {/* AI 요약 */}
                                <div>
                                    <label className="adm-label">AI 요약 (선택)</label>
                                    <textarea className="adm-textarea" placeholder="행사에 대한 간략한 소개 (2~3문장)" value={form.aiSummary} onChange={set("aiSummary")} rows={3} />
                                </div>

                                {/* 원본 URL */}
                                <div>
                                    <label className="adm-label">원본 URL (선택)</label>
                                    <div className="field-wrap">
                                        <Link size={15} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="adm-input" type="url" placeholder="https://..." value={form.originUrl} onChange={set("originUrl")} />
                                    </div>
                                </div>
                            </div>

                            {/* 섹션: 테마 색상 */}
                            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "28px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                    <Palette size={14} color="#9C9891" />
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const }}>테마 색상</span>
                                </div>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                                    {THEME_COLORS.map(c => (
                                        <button
                                            key={c.value}
                                            type="button"
                                            onClick={() => setForm(prev => ({ ...prev, themeColor: c.value }))}
                                            title={c.label}
                                            style={{
                                                width: "40px", height: "40px", borderRadius: "12px",
                                                backgroundColor: c.value, border: "none", cursor: "pointer",
                                                outline: form.themeColor === c.value ? `3px solid ${c.value}` : "3px solid transparent",
                                                outlineOffset: "3px", transition: "all 0.15s",
                                                transform: form.themeColor === c.value ? "scale(1.1)" : "scale(1)",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                            }}
                                        >
                                            {form.themeColor === c.value && <Check size={16} color="#fff" />}
                                        </button>
                                    ))}
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginLeft: "4px" }}>
                                        <div style={{ width: "40px", height: "40px", borderRadius: "12px", backgroundColor: form.themeColor, border: "1px solid #E8E5DF", flexShrink: 0 }} />
                                        <div>
                                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#52504B" }}>{form.themeColor.toUpperCase()}</p>
                                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891", fontWeight: 300 }}>선택된 색상</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 액션 버튼 */}
                            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", paddingTop: "4px" }}>
                                <button
                                    type="button"
                                    onClick={() => { setForm({ ...EMPTY_FORM }); setStatus(null); }}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 24px", backgroundColor: "transparent", border: "1.5px solid #D0CDC7", borderRadius: "10px", color: "#52504B", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500, cursor: "pointer", transition: "border-color 0.2s" }}
                                    onMouseEnter={e => (e.currentTarget.style.borderColor = "#0B2040")}
                                    onMouseLeave={e => (e.currentTarget.style.borderColor = "#D0CDC7")}
                                >
                                    <RotateCcw size={14} /> 초기화
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "13px 32px", backgroundColor: loading ? "#9C9891" : "#0B2040", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s, transform 0.15s" }}
                                    onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = "#183568"; }}
                                    onMouseLeave={e => { if (!loading) e.currentTarget.style.backgroundColor = "#0B2040"; }}
                                >
                                    {loading ? (
                                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                            등록 중...
                                        </span>
                                    ) : (
                                        <><PlusCircle size={15} /> 행사 등록</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </main>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </>
    );
}
