"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Cross } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
        setLoading(true); setError(null);
        try {
            // TODO: 실제 로그인 API 연결
            await new Promise(r => setTimeout(r, 800));
            router.push("/");
        } catch {
            setError("로그인에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .auth-wrap { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
                @media (max-width: 768px) { .auth-wrap { grid-template-columns: 1fr; } .auth-brand { display: none; } }
                .auth-input {
                    width: 100%; padding: 14px 16px;
                    border: 1.5px solid #E8E5DF; border-radius: 12px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                }
                .auth-input:focus { border-color: #0B2040; }
                .auth-input::placeholder { color: #9C9891; }
                .auth-btn-primary {
                    width: 100%; padding: 15px; background: #0B2040; color: #fff;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 15px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background 0.2s, transform 0.15s;
                }
                .auth-btn-primary:hover:not(:disabled) { background: #183568; transform: translateY(-1px); }
                .auth-btn-primary:disabled { background: #9C9891; cursor: not-allowed; }
            `}</style>

            <div className="auth-wrap">

                {/* ── 왼쪽: 브랜딩 패널 ───────────────────────────── */}
                <div className="auth-brand" style={{
                    backgroundColor: "#0B2040",
                    display: "flex", flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "52px 56px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* 배경 장식 */}
                    <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "340px", height: "340px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.12)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "80px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.08)", pointerEvents: "none" }} />

                    {/* 로고 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(201,169,110,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="2" x2="12" y2="22"/><line x1="4" y1="8" x2="20" y2="8"/>
                            </svg>
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>Catholica</span>
                    </div>

                    {/* 메인 카피 */}
                    <div>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase", marginBottom: "20px" }}>
                            Welcome Back
                        </p>
                        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(32px, 3.5vw, 48px)", color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "20px" }}>
                            다시 오셨군요,<br />
                            <span style={{ color: "#C9A96E" }}>잘 오셨습니다.</span>
                        </h1>
                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.9, fontWeight: 300 }}>
                            전국 가톨릭 행사를 한곳에서 확인하고<br />
                            관심 행사를 즐겨찾기 하세요.
                        </p>
                    </div>

                    {/* 하단 통계 */}
                    <div style={{ display: "flex", gap: "40px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        {[["피정", "강의"], ["미사", "순례"], ["청년", "문화"]].map((pair, i) => (
                            <div key={i}>
                                {pair.map(cat => (
                                    <span key={cat} style={{ display: "block", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>{cat}</span>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 오른쪽: 폼 패널 ─────────────────────────────── */}
                <div style={{
                    backgroundColor: "#F8F7F4",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "52px 40px",
                }}>
                    <div style={{ width: "100%", maxWidth: "400px" }}>

                        {/* 헤더 */}
                        <div style={{ marginBottom: "40px" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "12px" }}>
                                Sign In
                            </p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "28px", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "8px" }}>
                                로그인
                            </h2>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891", fontWeight: 300 }}>
                                계정이 없으신가요?{" "}
                                <button onClick={() => router.push("/register")} style={{ background: "none", border: "none", color: "#0B2040", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}>
                                    회원가입
                                </button>
                            </p>
                        </div>

                        {/* 에러 메시지 */}
                        {error && (
                            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginBottom: "24px" }}>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626", fontWeight: 400 }}>{error}</p>
                            </div>
                        )}

                        {/* 폼 */}
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                            {/* 이메일 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                                    이메일
                                </label>
                                <input
                                    type="email"
                                    className="auth-input"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>

                            {/* 비밀번호 */}
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                                    <label style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const }}>
                                        비밀번호
                                    </label>
                                    <button type="button" onClick={() => {}} style={{ background: "none", border: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", cursor: "pointer" }}>
                                        비밀번호 찾기
                                    </button>
                                </div>
                                <div style={{ position: "relative" }}>
                                    <input
                                        type={showPw ? "text" : "password"}
                                        className="auth-input"
                                        placeholder="비밀번호 입력"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        style={{ paddingRight: "48px" }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPw(!showPw)}
                                        style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9C9891", display: "flex", alignItems: "center" }}
                                    >
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* 로그인 버튼 */}
                            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: "8px" }}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}>
                                            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                                        </svg>
                                        로그인 중...
                                    </span>
                                ) : (
                                    <><span>로그인</span><ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>

                        {/* 구분선 */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", margin: "28px 0" }}>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "#E8E5DF" }} />
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#9C9891", letterSpacing: "0.1em" }}>OR</span>
                            <div style={{ flex: 1, height: "1px", backgroundColor: "#E8E5DF" }} />
                        </div>

                        {/* 행사 등록 링크 */}
                        <button
                            onClick={() => router.push("/register-event")}
                            style={{
                                width: "100%", padding: "15px", background: "transparent",
                                border: "1.5px solid #E8E5DF", borderRadius: "12px", cursor: "pointer",
                                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500,
                                color: "#52504B", display: "flex", alignItems: "center", justifyContent: "center",
                                gap: "8px", transition: "border-color 0.2s",
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = "#0B2040")}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = "#E8E5DF")}
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                            행사 등록하기
                        </button>

                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", textAlign: "center", marginTop: "32px", lineHeight: 1.7, fontWeight: 300 }}>
                            로그인하면 이용약관 및 개인정보처리방침에 동의한 것으로 간주됩니다.
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </>
    );
}
