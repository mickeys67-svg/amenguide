"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/common/Logo";

/* ── 소셜 로그인 SVG 아이콘 ─────────────────────────────────────────── */
const KakaoIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M12 3C6.477 3 2 6.477 2 10.8c0 2.756 1.667 5.18 4.2 6.647L5.1 21l4.5-2.25A11.06 11.06 0 0 0 12 18.6c5.523 0 10-3.477 10-7.8S17.523 3 12 3Z" fill="#3C1E1E"/>
    </svg>
);
const NaverIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <path d="M13.75 12.6 9.6 6H6v12h4.25l4.15-6.6V18H18V6h-4.25Z" fill="white"/>
    </svg>
);
const GoogleIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

const SOCIAL = [
    {
        id: "kakao", label: "카카오로 로그인",
        bg: "#FEE500", color: "#3C1E1E", border: "#FEE500",
        hoverBg: "#F0D800",
        icon: <KakaoIcon />,
        href: "/api/auth/kakao",
    },
    {
        id: "naver", label: "네이버로 로그인",
        bg: "#03C75A", color: "#FFFFFF", border: "#03C75A",
        hoverBg: "#02B350",
        icon: <NaverIcon />,
        href: "/api/auth/naver",
    },
    {
        id: "google", label: "구글로 로그인",
        bg: "#FFFFFF", color: "#3C4043", border: "#D0CDC7",
        hoverBg: "#F8F7F4",
        icon: <GoogleIcon />,
        href: "/api/auth/google",
    },
];

export default function LoginPage() {
    const router = useRouter();
    const [showEmail, setShowEmail] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleSocial = (id: string, href: string) => {
        setSocialLoading(id);
        // TODO: 실제 OAuth redirect
        setTimeout(() => { setSocialLoading(null); }, 1200);
    };

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
        setLoading(true); setError(null);
        try {
            await new Promise(r => setTimeout(r, 800));
            router.push("/");
        } catch { setError("로그인에 실패했습니다."); }
        finally { setLoading(false); }
    };

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .auth-wrap { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
                @media (max-width: 768px) { .auth-wrap { grid-template-columns: 1fr; } .auth-brand { display: none !important; } }
                .auth-input {
                    width: 100%; padding: 14px 16px;
                    border: 1.5px solid #E8E5DF; border-radius: 12px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                }
                .auth-input:focus { border-color: #0B2040; }
                .auth-input::placeholder { color: #9C9891; }
                .social-btn {
                    width: 100%; padding: 15px 20px;
                    border-radius: 14px; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 15px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 10px;
                    transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
                    position: relative;
                }
                .social-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
                .social-btn:active { transform: translateY(0); }
                .email-toggle {
                    background: none; border: none; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 13px; color: #9C9891;
                    display: flex; align-items: center; gap: 4px; transition: color 0.2s;
                }
                .email-toggle:hover { color: #52504B; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideDown { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                .slide-down { animation: slideDown 0.25s ease; }
            `}</style>

            <div className="auth-wrap">

                {/* ── 왼쪽: 브랜딩 ─────────────────────────── */}
                <div className="auth-brand" style={{
                    backgroundColor: "#0B2040", display: "flex", flexDirection: "column",
                    justifyContent: "space-between", padding: "52px 56px",
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "340px", height: "340px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.12)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "60px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.08)", pointerEvents: "none" }} />

                    {/* 로고 */}
                    <Logo variant="light" size={80} />

                    {/* 카피 */}
                    <div>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "20px" }}>Welcome Back</p>
                        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(30px, 3.5vw, 48px)", color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "20px" }}>
                            다시 오셨군요,<br /><span style={{ color: "#C9A96E" }}>잘 오셨습니다.</span>
                        </h1>
                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.9, fontWeight: 300 }}>
                            전국 가톨릭 행사를 한곳에서 확인하고<br />관심 행사를 즐겨찾기 하세요.
                        </p>
                    </div>

                    {/* 소셜 뱃지 */}
                    <div style={{ paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, marginBottom: "14px" }}>간편 로그인 지원</p>
                        <div style={{ display: "flex", gap: "10px" }}>
                            {[{ bg: "#FEE500", label: "K" }, { bg: "#03C75A", label: "N" }, { bg: "#FFFFFF", label: "G" }].map(s => (
                                <div key={s.label} style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: s.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 700, color: s.label === "K" ? "#3C1E1E" : s.label === "N" ? "#fff" : "#4285F4" }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── 오른쪽: 폼 ───────────────────────────── */}
                <div style={{ backgroundColor: "#F8F7F4", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "52px 40px" }}>
                    <div style={{ width: "100%", maxWidth: "400px" }}>

                        {/* 헤더 */}
                        <div style={{ marginBottom: "36px" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "12px" }}>Sign In</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "28px", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "8px" }}>로그인</h2>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891", fontWeight: 300 }}>
                                계정이 없으신가요?{" "}
                                <button onClick={() => router.push("/register")} style={{ background: "none", border: "none", color: "#0B2040", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}>
                                    회원가입
                                </button>
                            </p>
                        </div>

                        {/* ── 소셜 버튼 3개 ─────────────────── */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
                            {SOCIAL.map(s => (
                                <button
                                    key={s.id}
                                    className="social-btn"
                                    onClick={() => handleSocial(s.id, s.href)}
                                    disabled={!!socialLoading}
                                    style={{ backgroundColor: s.bg, color: s.color, border: `1.5px solid ${s.border}`, opacity: socialLoading && socialLoading !== s.id ? 0.5 : 1 }}
                                >
                                    {socialLoading === s.id ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                    ) : s.icon}
                                    <span>{s.label}</span>
                                </button>
                            ))}
                        </div>

                        {/* ── 이메일 로그인 토글 ──────────────── */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "#E8E5DF" }} />
                            <button className="email-toggle" onClick={() => setShowEmail(!showEmail)}>
                                이메일로 로그인
                                <ChevronDown size={14} style={{ transition: "transform 0.2s", transform: showEmail ? "rotate(180deg)" : "rotate(0deg)" }} />
                            </button>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "#E8E5DF" }} />
                        </div>

                        {/* ── 이메일 폼 (접힘) ─────────────────── */}
                        {showEmail && (
                            <div className="slide-down">
                                {error && (
                                    <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px" }}>
                                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p>
                                    </div>
                                )}
                                <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                                    <div>
                                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "7px" }}>이메일</label>
                                        <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "7px" }}>
                                            <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const }}>비밀번호</label>
                                            <button type="button" style={{ background: "none", border: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", cursor: "pointer" }}>비밀번호 찾기</button>
                                        </div>
                                        <div style={{ position: "relative" }}>
                                            <input className="auth-input" type={showPw ? "text" : "password"} placeholder="비밀번호 입력" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: "48px" }} />
                                            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9C9891", display: "flex" }}>
                                                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} style={{ width: "100%", padding: "14px", backgroundColor: loading ? "#9C9891" : "#0B2040", color: "#fff", border: "none", borderRadius: "12px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "background 0.2s" }}>
                                        {loading ? <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>로그인 중...</> : <>로그인 <ArrowRight size={15} /></>}
                                    </button>
                                </form>
                            </div>
                        )}

                        {/* 행사 등록 링크 */}
                        <button onClick={() => router.push("/register-event")} style={{ width: "100%", marginTop: "20px", padding: "14px", background: "transparent", border: "1.5px solid #E8E5DF", borderRadius: "12px", cursor: "pointer", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 400, color: "#9C9891", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", transition: "border-color 0.2s, color 0.2s" }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = "#0B2040"; e.currentTarget.style.color = "#0B2040"; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = "#E8E5DF"; e.currentTarget.style.color = "#9C9891"; }}>
                            ✦ 행사 등록은 여기서
                        </button>

                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891", textAlign: "center", marginTop: "28px", lineHeight: 1.7, fontWeight: 300 }}>
                            로그인 시 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
