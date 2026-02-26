"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, MapPin, Calendar, Link, FileText, Upload, X, ImageIcon } from "lucide-react";

const CATEGORIES = [
    { label: "피정",   color: "#1B4080", bg: "rgba(27,64,128,0.1)" },
    { label: "미사",   color: "#6E2882", bg: "rgba(110,40,130,0.1)" },
    { label: "강의",   color: "#1A6B40", bg: "rgba(26,107,64,0.1)" },
    { label: "순례",   color: "#C83A1E", bg: "rgba(200,58,30,0.1)" },
    { label: "청년",   color: "#0B6B70", bg: "rgba(11,107,112,0.1)" },
    { label: "문화",   color: "#7C3AED", bg: "rgba(124,58,237,0.1)" },
    { label: "선교",   color: "#C9A96E", bg: "rgba(201,169,110,0.12)" },
    { label: "특강",   color: "#C83A1E", bg: "rgba(200,58,30,0.08)" },
    { label: "강론",   color: "#6E2882", bg: "rgba(110,40,130,0.08)" },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://amenguide-backend-775250805671.us-west1.run.app";

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
    const [step, setStep] = useState(1);
    const [form, setForm] = useState<FormState>({
        title: "", category: "피정", date: "", endDate: "",
        location: "", description: "", originUrl: "",
        organizerName: "", organizerContact: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Image upload state
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageUploading, setImageUploading] = useState(false);
    const [imageDragging, setImageDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // ── 이미지 처리 ────────────────────────────────────────────────────
    const handleImageFile = useCallback(async (file: File) => {
        if (!file.type.startsWith("image/")) { setError("이미지 파일만 업로드할 수 있습니다."); return; }
        if (file.size > 5 * 1024 * 1024) { setError("이미지는 5MB 이하여야 합니다."); return; }

        setImageFile(file);
        setImageUrl(null);
        const reader = new FileReader();
        reader.onload = e => setImagePreview(e.target?.result as string);
        reader.readAsDataURL(file);

        // GCS 업로드 시도
        setImageUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(`${API_BASE}/events/upload-image`, { method: "POST", body: fd });
            const data = await res.json();
            if (data.url) setImageUrl(data.url);
        } catch { /* GCS 미설정 — imageUrl remains null, preview still shown */ }
        finally { setImageUploading(false); }
    }, []);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); setImageDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleImageFile(file);
    };

    const removeImage = () => {
        setImageFile(null); setImagePreview(null); setImageUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ── 최종 제출 ──────────────────────────────────────────────────────
    const handleSubmit = async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/events/submit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    category: form.category,
                    date: form.date || undefined,
                    location: form.location,
                    description: form.description || undefined,
                    originUrl: form.originUrl || undefined,
                    imageUrl: imageUrl ?? undefined,
                    submitterName: form.organizerName || undefined,
                    submitterContact: form.organizerContact || undefined,
                }),
            });
            if (res.ok) {
                setStep(3);
            } else {
                const data = await res.json();
                setError(data.message ?? "등록 중 오류가 발생했습니다.");
            }
        } catch {
            setError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
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
                .upload-zone {
                    border: 2px dashed #D0CDC7; border-radius: 14px;
                    padding: 36px 24px; text-align: center; cursor: pointer;
                    transition: all 0.2s; background: #FFFFFF;
                }
                .upload-zone:hover, .upload-zone.dragging {
                    border-color: #0B2040; background: rgba(11,32,64,0.03);
                }
            `}</style>

            <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4" }}>

                {/* ── 상단 바 ─────────────────────────────────── */}
                <header style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E5DF", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <button onClick={() => router.push("/")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", color: "#52504B", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px" }}>
                            <ArrowLeft size={16} /><span>홈으로</span>
                        </button>
                        <div style={{ width: "1px", height: "20px", backgroundColor: "#E8E5DF" }} />
                        <span style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "16px", color: "#100F0F" }}>행사 등록</span>
                    </div>
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
                                <div>
                                    <label className="ev-label">행사 제목 *</label>
                                    <div className="field-wrap">
                                        <FileText size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891" }} />
                                        <input className="ev-input" type="text" placeholder="예: 2026 봄 피정 프로그램" value={form.title} onChange={set("title")} />
                                    </div>
                                </div>

                                <div>
                                    <label className="ev-label">카테고리 *</label>
                                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                        {CATEGORIES.map(cat => (
                                            <button key={cat.label} type="button" className="cat-chip"
                                                onClick={() => setForm(prev => ({ ...prev, category: cat.label }))}
                                                style={{ backgroundColor: form.category === cat.label ? cat.bg : "#FFFFFF", borderColor: form.category === cat.label ? cat.color : "#E8E5DF", color: form.category === cat.label ? cat.color : "#52504B", fontWeight: form.category === cat.label ? 600 : 400 }}>
                                                {form.category === cat.label && <Check size={12} />}{cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

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

                                <div>
                                    <label className="ev-label">장소 *</label>
                                    <div className="field-wrap">
                                        <MapPin size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="ev-input" type="text" placeholder="예: 서울 명동대성당" value={form.location} onChange={set("location")} />
                                    </div>
                                </div>
                            </div>

                            {error && <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginTop: "24px" }}><p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p></div>}

                            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "36px" }}>
                                <button className="ev-btn-primary" onClick={handleNext}>다음 단계 <ArrowRight size={16} /></button>
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
                            <div style={{ backgroundColor: "#0B2040", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", gap: "16px", alignItems: "center" }}>
                                {imagePreview ? (
                                    <div style={{ width: "48px", height: "48px", borderRadius: "10px", backgroundImage: `url(${imagePreview})`, backgroundSize: "cover", backgroundPosition: "center", flexShrink: 0 }} />
                                ) : (
                                    <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: selectedCat.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", fontWeight: 600, color: selectedCat.color }}>{form.category}</span>
                                    </div>
                                )}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "15px", color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.title || "행사 제목"}</p>
                                    <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                                        {form.date && <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{form.date}</span>}
                                        {form.location && <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: 300 }}>📍 {form.location}</span>}
                                    </div>
                                </div>
                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", color: "#C9A96E", letterSpacing: "0.1em", textTransform: "uppercase" as const, flexShrink: 0 }}>Preview</span>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>

                                {/* 사진 업로드 */}
                                <div>
                                    <label className="ev-label">행사 사진 (선택)</label>
                                    {imagePreview ? (
                                        <div style={{ position: "relative", borderRadius: "14px", overflow: "hidden", border: "1.5px solid #E8E5DF" }}>
                                            <img src={imagePreview} alt="preview" style={{ width: "100%", height: "200px", objectFit: "cover", display: "block" }} />
                                            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 60%, rgba(0,0,0,0.5))", display: "flex", alignItems: "flex-end", padding: "16px" }}>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#fff", fontWeight: 300, display: "flex", alignItems: "center", gap: "6px" }}>
                                                        {imageUploading ? (
                                                            <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>업로드 중...</>
                                                        ) : imageUrl ? "✓ 업로드 완료" : imageFile?.name}
                                                    </p>
                                                </div>
                                                <button type="button" onClick={removeImage}
                                                    style={{ background: "rgba(0,0,0,0.5)", border: "none", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff" }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className={`upload-zone${imageDragging ? " dragging" : ""}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={e => { e.preventDefault(); setImageDragging(true); }}
                                            onDragLeave={() => setImageDragging(false)}
                                            onDrop={handleDrop}
                                        >
                                            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                                                <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "#F0EFE9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                                    <ImageIcon size={22} color="#9C9891" />
                                                </div>
                                                <div>
                                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#52504B", fontWeight: 500, marginBottom: "4px" }}>클릭하거나 드래그하여 사진 업로드</p>
                                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", fontWeight: 300 }}>PNG, JPG, WEBP · 최대 5MB</p>
                                                </div>
                                                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 18px", backgroundColor: "#0B2040", color: "#fff", borderRadius: "8px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500 }}>
                                                    <Upload size={14} /> 파일 선택
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
                                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }} />
                                </div>

                                {/* 행사 소개 */}
                                <div>
                                    <label className="ev-label">행사 소개</label>
                                    <textarea className="ev-textarea" placeholder="행사에 대한 간략한 소개를 작성해주세요. (2~4문장 권장)"
                                        value={form.description} onChange={set("description")} rows={4} maxLength={500} />
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>{form.description.length} / 500자</p>
                                </div>

                                {/* 원본 URL */}
                                <div>
                                    <label className="ev-label">행사 페이지 URL</label>
                                    <div className="field-wrap">
                                        <Link size={16} style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9C9891", pointerEvents: "none" }} />
                                        <input className="ev-input" type="url" placeholder="https://..." value={form.originUrl} onChange={set("originUrl")} />
                                    </div>
                                </div>

                                {/* 주최자 정보 */}
                                <div style={{ padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF" }}>
                                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "#9C9891", textTransform: "uppercase" as const, marginBottom: "16px" }}>주최자 정보 (선택)</p>
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                                        <div>
                                            <label className="ev-label">기관명 / 이름</label>
                                            <input className="ev-input no-icon" type="text" placeholder="예: 명동대성당" value={form.organizerName} onChange={set("organizerName")} />
                                        </div>
                                        <div>
                                            <label className="ev-label">연락처</label>
                                            <input className="ev-input no-icon" type="text" placeholder="전화번호 또는 이메일" value={form.organizerContact} onChange={set("organizerContact")} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {error && <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", padding: "12px 16px", marginTop: "24px" }}><p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#DC2626" }}>{error}</p></div>}

                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "36px" }}>
                                <button className="ev-btn-outline" onClick={() => setStep(1)}><ArrowLeft size={16} /> 이전</button>
                                <button className="ev-btn-primary" onClick={handleSubmit} disabled={loading || imageUploading}>
                                    {loading ? (
                                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                            등록 중...
                                        </span>
                                    ) : imageUploading ? (
                                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: "spin 1s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                                            이미지 업로드 중...
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
                            <div style={{ width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(201,169,110,0.12)", border: "2px solid #C9A96E", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 28px" }}>
                                <Check size={36} color="#C9A96E" />
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "16px" }}>Registration Submitted</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(26px, 4vw, 38px)", color: "#100F0F", letterSpacing: "-0.03em", marginBottom: "20px" }}>등록 완료!</h2>
                            <div style={{ maxWidth: "440px", margin: "0 auto 40px", padding: "24px", backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF" }}>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#9C9891", textTransform: "uppercase" as const, marginBottom: "12px" }}>다음 단계</p>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    {["등록하신 행사가 검토 대기 중입니다.", "관리자가 내용을 검토한 후 승인하면", "catholica.kr 홈페이지에 공개됩니다."].map((t, i) => (
                                        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                                            <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#0B204010", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#0B2040", fontWeight: 700 }}>{i + 1}</span>
                                            </div>
                                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#52504B", fontWeight: 300, lineHeight: 1.6 }}>{t}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                                <button className="ev-btn-primary" onClick={() => router.push("/")}>홈으로 돌아가기 <ArrowRight size={16} /></button>
                                <button className="ev-btn-outline" onClick={() => {
                                    setStep(1);
                                    setForm({ title: "", category: "피정", date: "", endDate: "", location: "", description: "", originUrl: "", organizerName: "", organizerContact: "" });
                                    setImageFile(null); setImagePreview(null); setImageUrl(null);
                                }}>새 행사 등록</button>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
