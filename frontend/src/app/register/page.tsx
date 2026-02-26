"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";

const ROLES = [
    { id: "member", label: "신자", desc: "행사 탐색·즐겨찾기·알림" },
    { id: "organizer", label: "행사 주최자", desc: "행사 등록·관리" },
];

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [role, setRole] = useState("member");
    const [agreed, setAgreed] = useState(false);
    const [showPw, setShowPw] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
    const pwMatch = confirm.length > 0 && password === confirm;
    const pwMismatch = confirm.length > 0 && password !== confirm;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password || !confirm) { setError("모든 항목을 입력해주세요."); return; }
        if (password !== confirm) { setError("비밀번호가 일치하지 않습니다."); return; }
        if (!agreed) { setError("이용약관에 동의해주세요."); return; }
        setLoading(true); setError(null);
        try {
            await new Promise(r => setTimeout(r, 900));
            router.push("/");
        } catch {
            setError("회원가입에 실패했습니다. 다시 시도해주세요.");
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
                .auth-input.error { border-color: #DC2626; }
                .auth-input.success { border-color: #16A34A; }
                .auth-input::placeholder { color: #9C9891; }
                .role-card {
                    flex: 1; padding: 16px; border: 1.5px solid #E8E5DF; border-radius: 12px;
                    cursor: pointer; background: #fff; transition: border-color 0.2s, background 0.2s;
                    text-align: left;
                }
                .role-card.active { border-color: #0B2040; background: rgba(11,32,64,0.04); }
                .role-card:hover { border-color: #D0CDC7; }
                .auth-btn-primary {
                    width: 100%; padding: 15px; background: #0B2040; color: #fff;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 15px; font-weight: 600;
                    display: flex; align-items: center; justify-content: center; gap: 8px;
                    transition: background 0.2s, transform 0.15s;
                }
                .auth-btn-primary:hover:not(:disabled) { background: #183568; transform: translateY(-1px); }
                .auth-btn-primary:disabled { background: #9C9891; cursor: not-allowed; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>

            <div className="auth-wrap">

                {/* ── 왼쪽: 브랜딩 ──────────────────────────── */}
                <div className="auth-brand" style={{
                    backgroundColor: "#0B2040",
                    display: "flex", flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "52px 56px",
                    position: "relative", overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: "-80px", right: "-80px", width: "340px", height: "340px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.12)", pointerEvents: "none" }} />
                    <div style={{ position: "absolute", bottom: "80px", left: "-60px", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(201,169,110,0.08)", pointerEvents: "none" }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(201,169,110,0.2)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2" strokeLinecap="round">
                                <line x1="12" y1="2" x2="12" y2="22"/><line x1="4" y1="8" x2="20" y2="8"/>
                            </svg>
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "13px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.9)", textTransform: "uppercase" }}>Catholica</span>
                    </div>

                    <div>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "20px" }}>
                            Join Us
                        </p>
                        <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(28px, 3vw, 44px)", color: "#FFFFFF", lineHeight: 1.2, letterSpacing: "-0.03em", marginBottom: "20px" }}>
                            가톨릭 신자를 위한<br />
                            <span style={{ color: "#C9A96E" }}>행사 허브에</span><br />오신 것을 환영합니다.
                        </h1>
                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "rgba(255,255,255,0.55)", lineHeight: 1.9, fontWeight: 300 }}>
                            피정부터 청년 문화 행사까지<br />
                            전국 가톨릭 행사를 한곳에서 만나보세요.
                        </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "14px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                        {["즐겨찾기 & 일정 알림", "맞춤 행사 추천", "행사 직접 등록 (주최자)"].map((item, i) => (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "rgba(201,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    <Check size={11} color="#C9A96E" />
                                </div>
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "rgba(255,255,255,0.6)", fontWeight: 300 }}>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── 오른쪽: 폼 ───────────────────────────── */}
                <div style={{
                    backgroundColor: "#F8F7F4",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    padding: "52px 40px",
                }}>
                    <div style={{ width: "100%", maxWidth: "420px" }}>

                        <div style={{ marginBottom: "32px" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "12px" }}>Create Account</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "26px", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "8px" }}>회원가입</h2>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891", fontWeight: 300 }}>
                                이미 계정이 있으신가요?{" "}
                                <button onClick={() => router.push("/login")} style={{ background: "none", border: "none", color: "#0B2040", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", fontSize: "inherit", textDecoration: "underline" }}>로그인</button>
                            </p>
                        </div>

                        {error && (
                            <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px" }}>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                            {/* 이름 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>이름</label>
                                <input className="auth-input" type="text" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} autoComplete="name" />
                            </div>

                            {/* 이메일 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>이메일</label>
                                <input className="auth-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                            </div>

                            {/* 비밀번호 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>비밀번호</label>
                                <div style={{ position: "relative" }}>
                                    <input className="auth-input" type={showPw ? "text" : "password"} placeholder="8자 이상 권장" value={password} onChange={e => setPassword(e.target.value)} style={{ paddingRight: "48px" }} />
                                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9C9891", display: "flex" }}>
                                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {/* 강도 바 */}
                                {password.length > 0 && (
                                    <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} style={{ flex: 1, height: "3px", borderRadius: "2px", backgroundColor: i <= pwStrength ? (pwStrength === 1 ? "#DC2626" : pwStrength === 2 ? "#F59E0B" : "#16A34A") : "#E8E5DF", transition: "background 0.3s" }} />
                                        ))}
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#9C9891", marginLeft: "6px", whiteSpace: "nowrap" }}>
                                            {pwStrength === 1 ? "약함" : pwStrength === 2 ? "보통" : "강함"}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* 비밀번호 확인 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>비밀번호 확인</label>
                                <div style={{ position: "relative" }}>
                                    <input
                                        className={`auth-input${pwMatch ? " success" : pwMismatch ? " error" : ""}`}
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="비밀번호 재입력"
                                        value={confirm}
                                        onChange={e => setConfirm(e.target.value)}
                                        style={{ paddingRight: "48px" }}
                                    />
                                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9C9891", display: "flex" }}>
                                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {pwMismatch && <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#DC2626", marginTop: "6px" }}>비밀번호가 일치하지 않습니다.</p>}
                                {pwMatch && <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#16A34A", marginTop: "6px" }}>✓ 비밀번호가 일치합니다.</p>}
                            </div>

                            {/* 역할 선택 */}
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "8px" }}>가입 목적</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {ROLES.map(r => (
                                        <button key={r.id} type="button" className={`role-card${role === r.id ? " active" : ""}`} onClick={() => setRole(r.id)}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, color: "#100F0F" }}>{r.label}</span>
                                                <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${role === r.id ? "#0B2040" : "#D0CDC7"}`, backgroundColor: role === r.id ? "#0B2040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                                    {role === r.id && <Check size={9} color="#fff" />}
                                                </div>
                                            </div>
                                            <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891", fontWeight: 300 }}>{r.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 약관 동의 */}
                            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                                <div
                                    onClick={() => setAgreed(!agreed)}
                                    style={{ width: "20px", height: "20px", borderRadius: "6px", border: `2px solid ${agreed ? "#0B2040" : "#D0CDC7"}`, backgroundColor: agreed ? "#0B2040" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px", transition: "all 0.2s", cursor: "pointer" }}
                                >
                                    {agreed && <Check size={11} color="#fff" />}
                                </div>
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#52504B", lineHeight: 1.6, fontWeight: 300 }}>
                                    <span style={{ color: "#0B2040", fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}>이용약관</span> 및{" "}
                                    <span style={{ color: "#0B2040", fontWeight: 500, textDecoration: "underline", cursor: "pointer" }}>개인정보처리방침</span>에 동의합니다.
                                </span>
                            </label>

                            {/* 제출 */}
                            <button type="submit" className="auth-btn-primary" disabled={loading} style={{ marginTop: "4px" }}>
                                {loading ? (
                                    <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                        처리 중...
                                    </span>
                                ) : (
                                    <><span>회원가입</span><ArrowRight size={16} /></>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
}
