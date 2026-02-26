"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Link, FileText, Tag } from "lucide-react";

const CATEGORIES = [
    { label: "피정",   color: "#1B4080", bg: "rgba(27,64,128,0.1)" },
    { label: "미사",   color: "#6E2882", bg: "rgba(110,40,130,0.1)" },
    { label: "강의",   color: "#1A6B40", bg: "rgba(26,107,64,0.1)" },
    { label: "순례",   color: "#C83A1E", bg: "rgba(200,58,30,0.1)" },
    { label: "청년",   color: "#0B6B70", bg: "rgba(11,107,112,0.1)" },
    { label: "문화",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
    { label: "선교",   color: "#C9A96E", bg: "rgba(201,169,110,0.12)" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://amenguide-backend-wcnovu4ydq-uw.a.run.app";

interface FormState {
    title: string;
    category: string;
    date: string;
    endDate: string;
    location: string;
    description: string;
    originUrl: string;
    organizerName: string;
    organizerContact: string;
}

export default function RegisterEventPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1=기본정보, 2=상세정보, 3=제출완료
    const [form, setForm] = useState<FormState>({
        title: "", category: "피정", date: "", endDate: "",
        location: "", description: "", originUrl: "",
        organizerName: "", organizerContact: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }));

    const validateStep1 = () => {
        if (!form.title.trim()) { setError("행사 제목을 입력해주세요."); return false; }
        if (!form.date) { setError("행사 날짜를 선택해주세요."); return false; }
        if (!form.location.trim()) { setError("행사 장소를 입력해주세요."); return false; }
        return true;
    };

    const handleNext = () => {
        setError(null);
        if (step === 1 && !validateStep1()) return;
        setStep(s => s + 1);
    };

    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
            // 실제 API 연결 시 엔드포인트 교체
            await new Promise(r => setTimeout(r, 1000));
            setStep(3);
        } catch {
            setError("등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    const selectedCat = CATEGORIES.find(c => c.label === form.category) ?? CATEGORIES[0];

    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .ev-input {
                    width: 100%; padding: 14px 16px 14px 44px;
                    border: 1.5px solid #E8E5DF; border-radius: 12px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                }
                .ev-input.no-icon { padding-left: 16px; }
                .ev-input:focus { border-color: #0B2040; }
                .ev-input::placeholder { color: #9C9891; }
                .ev-textarea {
                    width: 100%; padding: 14px 16px;
                    border: 1.5px solid #E8E5DF; border-radius: 12px;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 14px; color: #100F0F;
                    background: #FFFFFF; outline: none; transition: border-color 0.2s;
                    resize: vertical; min-height: 120px; line-height: 1.7;
                }
                .ev-textarea:focus { border-color: #0B2040; }
                .ev-textarea::placeholder { color: #9C9891; }
                .cat-chip {
                    padding: 8px 16px; border-radius: 20px; border: 1.5px solid transparent;
                    cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
                    font-size: 13px; font-weight: 500; transition: all 0.15s;
                    display: inline-flex; align-items: center; gap: 6px;
                }
                .ev-label {
                    display: block; font-family: 'DM Mono', monospace;
                    font-size: 10px; letter-spacing: 0.16em;
                    color: #52504B; text-transform: uppercase; margin-bottom: 8px;
                }
                .ev-btn-primary {
                    padding: 15px 32px; background: #0B2040; color: #fff;
                    border: none; border-radius: 12px; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 15px; font-weight: 600;
                    display: inline-flex; align-items: center; gap: 8px;
                    transition: background 0.2s, transform 0.15s;
                }
                .ev-btn-primary:hover:not(:disabled) { background: #183568; transform: translateY(-1px); }
                .ev-btn-primary:disabled { background: #9C9891; cursor: not-allowed; }
                .ev-btn-outline {
                    padding: 15px 28px; background: transparent;
                    border: 1.5px solid #D0CDC7; border-radius: 12px; cursor: pointer;
                    font-family: 'Noto Sans KR', sans-serif; font-size: 15px; font-weight: 500;
                    color: #52504B; display: inline-flex; align-items: center; gap: 8px;
                    transition: border-color 0.2s;
                }
                .ev-btn-outline:hover { border-color: #0B2040; color: #0B2040; }
                .field-wrap { position: relative; }
                .field-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #9C9891; pointer-events: none; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
                .fade-in { animation: fadeIn 0.35s ease; }
            `}</style>

            <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4" }}>

                {/* ── 상단 바 ─────────────────────────────────── */}
                <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E5DF", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#52504B", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px" }}>
                            <ArrowLeft size={16} />
                            <span>홈으로</span>
                        </button>
                        <div style={{ width: "1px", height: "20px", backgroundColor: "#E8E5DF" }} />
                        <span style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "16px", color: "#100F0F" }}>행사 등록</span>
                    </div>

                    {/* 스텝 인디케이터 */}
                    {step < 3 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            {[["1", "기본 정보"], ["2", "상세 정보"]].map(([num, label], i) => {
                                const active = step === i + 1;
                                const done = step > i + 1;
                                return (
                                    <div key={num} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <div style={{ width: "26px", height: "26px", borderRadius: "50%", backgroundColor: done ? "#16A34A" : active ? "#0B2040" : "#E8E5DF", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>
                                            {done ? <Check size={13} color="#fff" /> : <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: active ? "#fff" : "#9C9891", fontWeight: 600 }}>{num}</span>}
                                        </div>
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: active ? "#100F0F" : "#9C9891", fontWeight: active ? 500 : 300 }}>{label}</span>
                                        {i < 1 && <div style={{ width: "24px", height: "1px", backgroundColor: done ? "#16A34A" : "#E8E5DF", margin: "0 2px" }} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </header>

                {/* ── 본문 ─────────────────────────────────────── */}
                <main style={{ maxWidth: "720px", margin: "0 auto", padding: "clamp(32px, 5vw, 56px) 24px" }}>

                    {/* ── STEP 1: 기본 정보 ─────────────────────── */}
                    {step === 1 && (
                        <div className="fade-in">
                            <div style={{ marginBottom: "36px" }}>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "10px" }}>Step 1 / 2</p>
                                <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "8px" }}>기본 정보</h1>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891", fontWeight: 300 }}>행사의 핵심 정보를 입력해주세요.</p>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                                {/* 제목 */}
                                <div>
                                    <label className="ev-label">행사 제목 *</label>
                                    <div className="field-wrap">
                                        <FileText size={16} className="field-icon" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891" }} />
                                        <input className="ev-input" type="text" placeholder="예: 2026 봄 피정 프로그램" value={form.title} onChange={set("title")} />
                                    </div>
                                </div>

                                {/* 카테고리 */}
                                <div>
                                    <label className="ev-label">카테고리 *</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {CATEGORIES.map(cat => (
                                            <button
                                                key={cat.label}
                                                type="button"
                                                className="cat-chip"
                                                onClick={() => setForm(prev => ({ ...prev, category: cat.label }))}
                                                style={{
                                                    backgroundColor: form.category === cat.label ? cat.bg : "#FFFFFF",
                                                    borderColor: form.category === cat.label ? cat.color : "#E8E5DF",
                                                    color: form.category === cat.label ? cat.color : "#52504B",
                                                    fontWeight: form.category === cat.label ? 600 : 400,
                                                }}
                                            >
                                                {form.category === cat.label && <Check size={12} />}
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* 날짜 */}
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                    <div>
                                        <label className="ev-label">시작 날짜 *</label>
                                        <div className="field-wrap">
                                            <Calendar size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                            <input className="ev-input" type="date" value={form.date} onChange={set("date")} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="ev-label">종료 날짜</label>
                                        <div className="field-wrap">
                                            <Calendar size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                            <input className="ev-input" type="date" value={form.endDate} onChange={set("endDate")} min={form.date} />
                                        </div>
                                    </div>
                                </div>

                                {/* 장소 */}
                                <div>
                                    <label className="ev-label">장소 *</label>
                                    <div className="field-wrap">
                                        <MapPin size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="ev-input" type="text" placeholder="예: 서울 명동대성당" value={form.location} onChange={set("location")} />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginTop: "24px" }}>
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "36px" }}>
                                <button className="ev-btn-primary" onClick={handleNext}>
                                    다음 단계 <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 2: 상세 정보 ─────────────────────── */}
                    {step === 2 && (
                        <div className="fade-in">
                            <div style={{ marginBottom: "36px" }}>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "10px" }}>Step 2 / 2</p>
                                <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(24px, 4vw, 36px)", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "8px" }}>상세 정보</h1>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891", fontWeight: 300 }}>행사에 대한 추가 정보를 입력해주세요. (선택사항)</p>
                            </div>

                            {/* 미리보기 카드 */}
                            <div style={{ backgroundColor: "#0B2040", borderRadius: "16px", padding: "24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "center" }}>
                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: selectedCat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${selectedCat.color}30` }}>
                                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", fontWeight: 600, color: selectedCat.color }}>{form.category}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "16px", color: "#FFFFFF", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                        {form.title || "행사 제목"}
                                    </p>
                                    <div style={{ display: "flex", gap: "16px", marginTop: "4px" }}>
                                        {form.date && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{form.date}</span>}
                                        {form.location && <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>📍 {form.location}</span>}
                                    </div>
                                </div>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#C9A96E", letterSpacing: "0.1em", textTransform: "uppercase" as const, flexShrink: 0 }}>Preview</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                                {/* 행사 소개 */}
                                <div>
                                    <label className="ev-label">행사 소개</label>
                                    <textarea
                                        className="ev-textarea"
                                        placeholder="행사에 대한 간략한 소개를 작성해주세요. (2~4문장 권장)"
                                        value={form.description}
                                        onChange={set("description")}
                                        rows={4}
                                    />
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>
                                        {form.description.length} / 500자
                                    </p>
                                </div>

                                {/* 원본 URL */}
                                <div>
                                    <label className="ev-label">행사 페이지 URL</label>
                                    <div className="field-wrap">
                                        <Link size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="ev-input" type="url" placeholder="https://..." value={form.originUrl} onChange={set("originUrl")} />
                                    </div>
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>교구·본당 공식 페이지 URL을 입력하면 자동으로 정보를 불러옵니다.</p>
                                </div>

                                {/* 주최자 정보 */}
                                <div style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF" }}>
                                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#9C9891", textTransform: "uppercase" as const, marginBottom: "16px" }}>주최자 정보 (선택)</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label className="ev-label">주최 기관명</label>
                                            <input className="ev-input no-icon" type="text" placeholder="예: 명동대성당" value={form.organizerName} onChange={set("organizerName")} />
                                        </div>
                                        <div>
                                            <label className="ev-label">연락처</label>
                                            <input className="ev-input no-icon" type="text" placeholder="전화번호 또는 이메일" value={form.organizerContact} onChange={set("organizerContact")} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginTop: "24px" }}>
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p>
                                </div>
                            )}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "36px" }}>
                                <button className="ev-btn-outline" onClick={() => setStep(1)}>
                                    <ArrowLeft size={16} /> 이전
                                </button>
                                <button className="ev-btn-primary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? (
                                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                            등록 중...
                                        </span>
                                    ) : (
                                        <><Check size={16} /> 행사 등록하기</>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── STEP 3: 완료 ──────────────────────────── */}
                    {step === 3 && (
                        <div className="fade-in" style={{ textAlign: "center", padding: "60px 0" }}>
                            <div style={{ width: "72px", height: "72px", borderRadius: "50%", backgroundColor: "rgba(22,163,74,0.1)", border: "2px solid #16A34A", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                                <Check size={32} color="#16A34A" />
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "16px" }}>Registration Complete</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(28px, 4vw, 40px)", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "16px" }}>
                                행사 등록 완료!
                            </h2>
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px", color: "#52504B", lineHeight: 1.9, fontWeight: 300, maxWidth: "400px", margin: "0 auto 40px" }}>
                                <strong style={{ color: "#100F0F" }}>{form.title}</strong> 행사가<br />
                                검토 후 곧 게재될 예정입니다.<br />
                                등록해주셔서 감사합니다.
                            </p>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="ev-btn-primary" onClick={() => router.push("/")}>
                                    홈으로 돌아가기 <ArrowRight size={16} />
                                </button>
                                <button className="ev-btn-outline" onClick={() => { setStep(1); setForm({ title: "", category: "피정", date: "", endDate: "", location: "", description: "", originUrl: "", organizerName: "", organizerContact: "" }); }}>
                                    새 행사 등록
                                </button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
