"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, AlertCircle, Shield, PlusCircle, RotateCcw, Calendar, MapPin, List, LogOut, X, Trash2, Edit2, CheckCircle, XCircle, Clock, Users, KeyRound, Mail, User } from "lucide-react";
import { Logo } from "@/components/common/Logo";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "https://amenguide-backend-775250805671.us-west1.run.app";

const CATEGORIES = ["피정", "미사", "강의", "순례", "청년", "문화", "선교", "기타", "특강", "강론", "피정의집"];

const THEME_COLORS = [
    { label: "딥 블루", value: "#1B4080" }, { label: "퍼플", value: "#6E2882" },
    { label: "포레스트", value: "#1A6B40" }, { label: "버밀리언", value: "#C83A1E" },
    { label: "틸", value: "#0B6B70" }, { label: "바이올렛", value: "#7C3AED" },
    { label: "골드", value: "#C9A96E" }, { label: "네이비", value: "#0B2040" },
];

const EMPTY_FORM = {
    title: "", date: "", location: "", category: "피정",
    aiSummary: "", themeColor: "#1B4080", originUrl: "", imageUrl: "",
};

const STATUS_LABEL: Record<string, string> = {
    APPROVED: "승인됨", PENDING: "대기중", REJECTED: "거절됨",
};
const STATUS_COLOR: Record<string, string> = {
    APPROVED: "#16A34A", PENDING: "#D97706", REJECTED: "#DC2626",
};
const STATUS_BG: Record<string, string> = {
    APPROVED: "#F0FDF4", PENDING: "#FFFBEB", REJECTED: "#FEF2F2",
};

type Tab = "pending" | "list" | "new" | "admins";
type StatusMsg = { type: "success" | "error"; msg: string } | null;

// ─── 수정 모달 ───────────────────────────────────────────────────────────
function EditModal({ event, adminToken, onClose, onSaved }: {
    event: any; adminToken: string; onClose: () => void; onSaved: () => void;
}) {
    const [form, setForm] = useState({
        title: event.title ?? "",
        date: event.date ? new Date(event.date).toISOString().slice(0, 16) : "",
        location: event.location ?? "",
        category: event.category ?? "피정",
        aiSummary: event.aiSummary ?? "",
        originUrl: event.originUrl ?? "",
        imageUrl: event.imageUrl ?? "",
        themeColor: event.themeColor ?? "#1B4080",
        status: event.status ?? "APPROVED",
    });
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(p => ({ ...p, [k]: e.target.value }));

    const handleSave = async () => {
        if (!form.title.trim()) { setErr("제목은 필수입니다."); return; }
        setSaving(true); setErr(null);
        try {
            const res = await fetch(`${API_BASE}/events/admin/events/${event.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + adminToken },
                body: JSON.stringify({ ...form, date: form.date || undefined }),
            });
            if (res.ok) { onSaved(); onClose(); }
            else { const d = await res.json(); setErr(d.message ?? "저장 실패"); }
        } catch (e) { setErr((e as Error).message); }
        finally { setSaving(false); }
    };

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "600px", backgroundColor: "#FFFFFF", borderRadius: "20px", border: "1px solid #E8E5DF", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 28px", borderBottom: "1px solid #E8E5DF" }}>
                    <h3 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "18px", color: "#100F0F" }}>행사 수정</h3>
                    <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9C9891", padding: "4px" }}><X size={20} /></button>
                </div>
                <div style={{ padding: "28px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {err && <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", color: "#DC2626", fontSize: "13px", fontFamily: "'Noto Sans KR', sans-serif" }}>{err}</div>}
                    <div>
                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>제목 *</label>
                        <input value={form.title} onChange={set("title")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>카테고리</label>
                            <select value={form.category} onChange={set("category")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>날짜</label>
                            <input type="datetime-local" value={form.date} onChange={set("date")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>장소</label>
                        <input value={form.location} onChange={set("location")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                    </div>
                    <div>
                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>설명</label>
                        <textarea value={form.aiSummary} onChange={set("aiSummary")} rows={3} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none", resize: "vertical" }} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>상태</label>
                            <select value={form.status} onChange={set("status")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }}>
                                <option value="APPROVED">승인됨</option>
                                <option value="PENDING">대기중</option>
                                <option value="REJECTED">거절됨</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>이미지 URL</label>
                            <input value={form.imageUrl} onChange={set("imageUrl")} placeholder="https://..." style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                        </div>
                    </div>
                    <div>
                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>원본 URL</label>
                        <input value={form.originUrl} onChange={set("originUrl")} placeholder="https://..." style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                    </div>
                </div>
                <div style={{ padding: "0 28px 28px", display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                    <button onClick={onClose} style={{ padding: "11px 22px", border: "1.5px solid #D0CDC7", borderRadius: "10px", background: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", cursor: "pointer", color: "#52504B" }}>취소</button>
                    <button onClick={handleSave} disabled={saving} style={{ padding: "11px 28px", backgroundColor: saving ? "#9C9891" : "#0B2040", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                        {saving ? "저장 중..." : "저장"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── 거절 모달 ───────────────────────────────────────────────────────────
function RejectModal({ id, title, adminToken, onClose, onRejected }: {
    id: string; title: string; adminToken: string; onClose: () => void; onRejected: () => void;
}) {
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);

    const handleReject = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/events/admin/events/${id}/reject`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + adminToken },
                body: JSON.stringify({ reason }),
            });
            if (res.ok) { onRejected(); onClose(); }
        } finally { setLoading(false); }
    };

    return (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ width: "100%", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "20px", border: "1px solid #E8E5DF" }}>
                <div style={{ padding: "24px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <h3 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "18px", color: "#100F0F" }}>행사 거절</h3>
                        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9C9891" }}><X size={20} /></button>
                    </div>
                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#52504B", marginBottom: "16px", fontWeight: 300 }}>
                        <strong style={{ color: "#100F0F", fontWeight: 600 }}>"{title}"</strong> 행사를 거절하시겠습니까?
                    </p>
                    <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>거절 사유 (선택)</label>
                    <textarea
                        value={reason} onChange={e => setReason(e.target.value)}
                        placeholder="거절 사유를 입력하세요..."
                        rows={3}
                        style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none", resize: "none" }}
                    />
                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "20px" }}>
                        <button onClick={onClose} style={{ padding: "11px 22px", border: "1.5px solid #D0CDC7", borderRadius: "10px", background: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", cursor: "pointer", color: "#52504B" }}>취소</button>
                        <button onClick={handleReject} disabled={loading} style={{ padding: "11px 22px", backgroundColor: loading ? "#9C9891" : "#DC2626", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
                            {loading ? "처리 중..." : "거절하기"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── 메인 ────────────────────────────────────────────────────────────────
export default function AdminPage() {
    // ── 인증 상태 ─────────────────────────────────────────────────────
    const [adminToken, setAdminToken] = useState("");
    const [adminId, setAdminId] = useState("");
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [authenticated, setAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // ── 로그인 폼 ─────────────────────────────────────────────────────
    const [loginEmail, setLoginEmail] = useState("");
    const [loginPassword, setLoginPassword] = useState("");

    // ── 탭 상태 ───────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<Tab>("pending");

    // ── 행사 데이터 ───────────────────────────────────────────────────
    const [pendingEvents, setPendingEvents] = useState<any[]>([]);
    const [allEvents, setAllEvents] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [statusFilter, setStatusFilter] = useState("");
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // ── 모달 ──────────────────────────────────────────────────────────
    const [editModal, setEditModal] = useState<any | null>(null);
    const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null);

    // ── 행사 등록 폼 ─────────────────────────────────────────────────
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [createLoading, setCreateLoading] = useState(false);
    const [createStatus, setCreateStatus] = useState<StatusMsg>(null);

    // ── 관리자 관리 상태 ─────────────────────────────────────────────
    const [adminsList, setAdminsList] = useState<any[]>([]);
    const [adminsLoading, setAdminsLoading] = useState(false);
    const [newAdminForm, setNewAdminForm] = useState({ name: "", email: "", password: "" });
    const [addAdminLoading, setAddAdminLoading] = useState(false);
    const [addAdminStatus, setAddAdminStatus] = useState<StatusMsg>(null);
    const [changePwForm, setChangePwForm] = useState({ oldPassword: "", newPassword: "" });
    const [changePwLoading, setChangePwLoading] = useState(false);
    const [changePwStatus, setChangePwStatus] = useState<StatusMsg>(null);
    const [showChangePw, setShowChangePw] = useState(false);

    // ── sessionStorage 복원 ────────────────────────────────────────
    useEffect(() => {
        const saved = sessionStorage.getItem("adminToken");
        if (!saved) return;
        setAuthLoading(true);
        fetch(`${API_BASE}/admin/auth/me`, {
            headers: { "Authorization": "Bearer " + saved },
        }).then(async res => {
            if (res.ok) {
                const data = await res.json();
                setAdminToken(saved);
                setAdminId(data.id);
                setAdminName(data.name);
                setAdminEmail(data.email);
                setAuthenticated(true);
            } else {
                sessionStorage.removeItem("adminToken");
            }
        }).catch(() => {
            sessionStorage.removeItem("adminToken");
        }).finally(() => setAuthLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── 로그인 ─────────────────────────────────────────────────────
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginEmail.trim() || !loginPassword) return;
        setAuthLoading(true);
        setAuthError(null);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                sessionStorage.setItem("adminToken", data.token);
                setAdminToken(data.token);
                setAdminId(data.admin.id);
                setAdminName(data.admin.name);
                setAdminEmail(data.admin.email);
                setAuthenticated(true);
            } else if (res.status === 401 || res.status === 400) {
                setAuthError(data.message ?? "이메일 또는 비밀번호가 올바르지 않습니다.");
            } else {
                setAuthError(`서버 오류 (${res.status}). 잠시 후 다시 시도해주세요.`);
            }
        } catch {
            setAuthError("서버에 연결할 수 없습니다. 네트워크를 확인해주세요.");
        } finally {
            setAuthLoading(false);
        }
    };

    // ── 로그아웃 ────────────────────────────────────────────────────
    const handleLogout = () => {
        sessionStorage.removeItem("adminToken");
        setAdminToken(""); setAdminId(""); setAdminName(""); setAdminEmail("");
        setAuthenticated(false);
        setPendingEvents([]); setAllEvents([]);
        setLoginEmail(""); setLoginPassword("");
    };

    // ── Admin 헤더 헬퍼 ────────────────────────────────────────────
    const authHeader = () => ({ "Authorization": "Bearer " + adminToken });

    // ── API calls ──────────────────────────────────────────────────
    const fetchPending = useCallback(async () => {
        setLoadingData(true); setFetchError(null);
        try {
            const res = await fetch(`${API_BASE}/events/admin/list?status=PENDING`, {
                headers: authHeader(),
            });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                setFetchError(`API 오류 ${res.status}: ${errBody.message ?? res.statusText}`);
                setPendingEvents([]); return;
            }
            const data = await res.json();
            setPendingEvents(Array.isArray(data) ? data : []);
        } catch (e) {
            setFetchError(`네트워크 오류: ${(e as Error).message}`);
            setPendingEvents([]);
        } finally { setLoadingData(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminToken]);

    const fetchAll = useCallback(async () => {
        setLoadingData(true); setFetchError(null);
        try {
            const url = statusFilter
                ? `${API_BASE}/events/admin/list?status=${statusFilter}`
                : `${API_BASE}/events/admin/list`;
            const res = await fetch(url, { headers: authHeader() });
            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                setFetchError(`API 오류 ${res.status}: ${errBody.message ?? res.statusText}`);
                setAllEvents([]); return;
            }
            const data = await res.json();
            setAllEvents(Array.isArray(data) ? data : []);
        } catch (e) {
            setFetchError(`네트워크 오류: ${(e as Error).message}`);
            setAllEvents([]);
        } finally { setLoadingData(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminToken, statusFilter]);

    const fetchAdmins = useCallback(async () => {
        setAdminsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/accounts`, { headers: authHeader() });
            if (res.ok) setAdminsList(await res.json());
        } finally { setAdminsLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [adminToken]);

    useEffect(() => {
        if (!authenticated) return;
        if (activeTab === "pending") fetchPending();
        else if (activeTab === "list") fetchAll();
        else if (activeTab === "admins") fetchAdmins();
    }, [authenticated, activeTab, fetchPending, fetchAll, fetchAdmins]);

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            await fetch(`${API_BASE}/events/admin/events/${id}/approve`, {
                method: "PATCH", headers: authHeader(),
            });
            fetchPending(); if (activeTab === "list") fetchAll();
        } finally { setActionLoading(null); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("정말 삭제하시겠습니까?")) return;
        setActionLoading(id);
        try {
            await fetch(`${API_BASE}/events/admin/events/${id}`, {
                method: "DELETE", headers: authHeader(),
            });
            if (activeTab === "pending") fetchPending(); else fetchAll();
        } finally { setActionLoading(null); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title) { setCreateStatus({ type: "error", msg: "행사 제목은 필수입니다." }); return; }
        setCreateLoading(true); setCreateStatus(null);
        try {
            const res = await fetch(`${API_BASE}/events/admin/events`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader() },
                body: JSON.stringify({ ...form, date: form.date || undefined }),
            });
            if (res.ok) {
                setCreateStatus({ type: "success", msg: "행사가 성공적으로 등록되었습니다." });
                setForm({ ...EMPTY_FORM });
            } else {
                const err = await res.json();
                setCreateStatus({ type: "error", msg: err.message ?? `오류 ${res.status}` });
            }
        } catch (err) { setCreateStatus({ type: "error", msg: (err as Error).message }); }
        finally { setCreateLoading(false); }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddAdminLoading(true); setAddAdminStatus(null);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/accounts`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeader() },
                body: JSON.stringify(newAdminForm),
            });
            const data = await res.json();
            if (res.ok) {
                setAddAdminStatus({ type: "success", msg: `${data.name}(${data.email}) 관리자가 추가되었습니다.` });
                setNewAdminForm({ name: "", email: "", password: "" });
                fetchAdmins();
            } else {
                setAddAdminStatus({ type: "error", msg: data.message ?? `오류 ${res.status}` });
            }
        } catch (err) { setAddAdminStatus({ type: "error", msg: (err as Error).message }); }
        finally { setAddAdminLoading(false); }
    };

    const handleDeleteAdmin = async (id: string, name: string) => {
        if (!confirm(`"${name}" 관리자를 삭제하시겠습니까?`)) return;
        try {
            const res = await fetch(`${API_BASE}/admin/auth/accounts/${id}`, {
                method: "DELETE", headers: authHeader(),
            });
            if (res.ok) fetchAdmins();
            else {
                const d = await res.json();
                alert(d.message ?? "삭제 실패");
            }
        } catch (e) { alert((e as Error).message); }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setChangePwLoading(true); setChangePwStatus(null);
        try {
            const res = await fetch(`${API_BASE}/admin/auth/accounts/${adminId}/password`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", ...authHeader() },
                body: JSON.stringify(changePwForm),
            });
            const data = await res.json();
            if (res.ok) {
                setChangePwStatus({ type: "success", msg: "비밀번호가 변경되었습니다." });
                setChangePwForm({ oldPassword: "", newPassword: "" });
                setShowChangePw(false);
            } else {
                setChangePwStatus({ type: "error", msg: data.message ?? "변경 실패" });
            }
        } catch (err) { setChangePwStatus({ type: "error", msg: (err as Error).message }); }
        finally { setChangePwLoading(false); }
    };

    const setField = (key: keyof typeof EMPTY_FORM) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
            setForm(prev => ({ ...prev, [key]: e.target.value }));

    const formatDate = (iso: string | null) => {
        if (!iso) return "날짜 미정";
        return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
    };

    // ── 인증 화면 ───────────────────────────────────────────────────
    if (!authenticated) {
        return (
            <>
                <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <div style={{ minHeight: "100vh", backgroundColor: "#0B2040", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                    <div style={{ width: "100%", maxWidth: "400px" }}>
                        <div style={{ textAlign: "center", marginBottom: "40px" }}>
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                                <Logo variant="light" size={80} />
                            </div>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" }}>Admin Panel</p>
                            <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "24px", color: "#FFFFFF", letterSpacing: "-0.02em", marginTop: "8px" }}>관리자 로그인</h1>
                        </div>
                        <form onSubmit={handleAuth}
                            style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)", padding: "32px", display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                                    <Mail size={10} /> 이메일
                                </label>
                                <input
                                    type="email" value={loginEmail}
                                    onChange={e => { setLoginEmail(e.target.value); setAuthError(null); }}
                                    placeholder="admin@amenguide.kr" autoFocus disabled={authLoading}
                                    style={{ width: "100%", padding: "13px 16px", backgroundColor: "rgba(255,255,255,0.08)", border: `1.5px solid ${authError ? "#F87171" : "rgba(255,255,255,0.15)"}`, borderRadius: "12px", color: "#FFFFFF", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }}
                                />
                            </div>
                            <div>
                                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.16em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, marginBottom: "8px" }}>
                                    <KeyRound size={10} /> 비밀번호
                                </label>
                                <input
                                    type="password" value={loginPassword}
                                    onChange={e => { setLoginPassword(e.target.value); setAuthError(null); }}
                                    placeholder="••••••••" disabled={authLoading}
                                    style={{ width: "100%", padding: "13px 16px", backgroundColor: "rgba(255,255,255,0.08)", border: `1.5px solid ${authError ? "#F87171" : "rgba(255,255,255,0.15)"}`, borderRadius: "12px", color: "#FFFFFF", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }}
                                />
                            </div>
                            {authError && (
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", backgroundColor: "rgba(248,113,113,0.12)", border: "1px solid rgba(248,113,113,0.3)", borderRadius: "10px" }}>
                                    <AlertCircle size={14} color="#F87171" />
                                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#F87171" }}>{authError}</span>
                                </div>
                            )}
                            <button type="submit" disabled={authLoading || !loginEmail.trim() || !loginPassword}
                                style={{ width: "100%", padding: "14px", backgroundColor: authLoading ? "rgba(201,169,110,0.5)" : "#C9A96E", color: "#0B2040", border: "none", borderRadius: "12px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px", fontWeight: 700, cursor: (authLoading || !loginEmail.trim() || !loginPassword) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginTop: "4px" }}>
                                {authLoading ? (
                                    <><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 0.8s linear infinite" }}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>확인 중...</>
                                ) : (
                                    <><Shield size={15} /> 로그인</>
                                )}
                            </button>
                        </form>
                        <p style={{ textAlign: "center", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "rgba(255,255,255,0.3)", marginTop: "24px", fontWeight: 300 }}>이 페이지는 관리자 전용입니다.</p>
                    </div>
                </div>
            </>
        );
    }

    const NAV_ITEMS: { id: Tab; icon: React.ReactNode; label: string; badge?: number }[] = [
        { id: "pending", icon: <Clock size={15} />, label: "대기 중", badge: pendingEvents.length || undefined },
        { id: "list", icon: <List size={15} />, label: "행사 목록" },
        { id: "new", icon: <PlusCircle size={15} />, label: "행사 등록" },
        { id: "admins", icon: <Users size={15} />, label: "관리자 관리" },
    ];

    // ── 탭 콘텐츠: 대기 중 ────────────────────────────────────────
    const renderPending = () => (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "8px" }}>Pending Approval</p>
                <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(20px, 2.5vw, 28px)", color: "#100F0F", letterSpacing: "-0.03em" }}>승인 대기 중</h1>
                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>아래 행사들을 검토 후 승인 또는 거절해주세요.</p>
            </div>
            {fetchError && (
                <div style={{ marginBottom: "20px", padding: "14px 18px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "10px", color: "#DC2626", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} /><span>{fetchError}</span>
                </div>
            )}
            {loadingData ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px" }}>불러오는 중...</div>
            ) : pendingEvents.length === 0 && !fetchError ? (
                <div style={{ textAlign: "center", padding: "80px 0" }}>
                    <CheckCircle size={48} color="#D0CDC7" style={{ margin: "0 auto 16px" }} />
                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: "18px", color: "#52504B", marginBottom: "8px" }}>대기 중인 행사가 없습니다</p>
                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", fontWeight: 300 }}>새로 등록된 행사가 여기 표시됩니다.</p>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {pendingEvents.map(ev => (
                        <div key={ev.id} style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", overflow: "hidden" }}>
                            <div style={{ display: "flex", gap: "0" }}>
                                {ev.imageUrl && (
                                    <div style={{ width: "120px", flexShrink: 0, background: `url(${ev.imageUrl}) center/cover no-repeat`, minHeight: "140px" }} />
                                )}
                                <div style={{ flex: 1, padding: "20px 24px" }}>
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "10px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                            <span style={{ padding: "3px 10px", borderRadius: "20px", backgroundColor: "#0B204012", color: "#0B2040", fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>{ev.category ?? "미분류"}</span>
                                            <span style={{ padding: "3px 10px", borderRadius: "20px", backgroundColor: STATUS_BG["PENDING"], color: STATUS_COLOR["PENDING"], fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700 }}>대기중</span>
                                        </div>
                                    </div>
                                    <p style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 700, fontSize: "16px", color: "#100F0F", marginBottom: "8px", lineHeight: 1.4 }}>{ev.title}</p>
                                    <div style={{ display: "flex", gap: "16px", marginBottom: "10px", flexWrap: "wrap" }}>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Calendar size={11} /> {formatDate(ev.date)}
                                        </span>
                                        {ev.location && <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891", fontWeight: 300, display: "flex", alignItems: "center", gap: "4px" }}>
                                            <MapPin size={11} /> {ev.location}
                                        </span>}
                                    </div>
                                    {(ev.submitterName || ev.submitterContact) && (
                                        <div style={{ padding: "8px 12px", backgroundColor: "#F8F7F4", borderRadius: "8px", marginBottom: "12px" }}>
                                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.12em", color: "#9C9891", textTransform: "uppercase" as const, marginBottom: "4px" }}>등록자</p>
                                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#52504B" }}>
                                                {ev.submitterName}{ev.submitterName && ev.submitterContact ? " · " : ""}{ev.submitterContact}
                                            </p>
                                        </div>
                                    )}
                                    {ev.aiSummary && (
                                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: "#52504B", fontWeight: 300, lineHeight: 1.7, marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflow: "hidden" }}>{ev.aiSummary}</p>
                                    )}
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                        <button onClick={() => handleApprove(ev.id)} disabled={actionLoading === ev.id}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: "#16A34A", color: "#fff", border: "none", borderRadius: "8px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, cursor: actionLoading === ev.id ? "not-allowed" : "pointer", opacity: actionLoading === ev.id ? 0.6 : 1 }}>
                                            <CheckCircle size={14} /> 승인
                                        </button>
                                        <button onClick={() => setRejectModal({ id: ev.id, title: ev.title })} disabled={actionLoading === ev.id}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA", borderRadius: "8px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                                            <XCircle size={14} /> 거절
                                        </button>
                                        <button onClick={() => setEditModal(ev)}
                                            style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "9px 18px", backgroundColor: "transparent", color: "#52504B", border: "1px solid #E8E5DF", borderRadius: "8px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", cursor: "pointer" }}>
                                            <Edit2 size={14} /> 수정
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ── 탭 콘텐츠: 행사 목록 ──────────────────────────────────────
    const renderList = () => (
        <div>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: "28px", gap: "16px", flexWrap: "wrap" }}>
                <div>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "8px" }}>Event List</p>
                    <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(20px, 2.5vw, 28px)", color: "#100F0F", letterSpacing: "-0.03em" }}>행사 목록</h1>
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                    style={{ padding: "9px 32px 9px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", outline: "none", cursor: "pointer", appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239C9891' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center", minWidth: "120px" }}>
                    <option value="">전체</option>
                    <option value="APPROVED">승인됨</option>
                    <option value="PENDING">대기중</option>
                    <option value="REJECTED">거절됨</option>
                </select>
            </div>
            {loadingData ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px" }}>불러오는 중...</div>
            ) : allEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "80px 0", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px" }}>행사가 없습니다.</div>
            ) : (
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid #E8E5DF" }}>
                                {["제목", "카테고리", "날짜", "상태", ""].map((h, i) => (
                                    <th key={i} style={{ padding: "12px 16px", textAlign: "left" as const, fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#9C9891", textTransform: "uppercase" as const, fontWeight: 500, whiteSpace: "nowrap" as const }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {allEvents.map((ev, i) => (
                                <tr key={ev.id} style={{ borderBottom: i < allEvents.length - 1 ? "1px solid #F0EFE9" : "none", transition: "background 0.15s" }}
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F8F7F4")}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                                    <td style={{ padding: "14px 16px", maxWidth: "280px" }}>
                                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#100F0F", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{ev.title}</p>
                                        {ev.location && <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891", fontWeight: 300, marginTop: "2px" }}>{ev.location}</p>}
                                    </td>
                                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" as const }}>
                                        <span style={{ padding: "3px 10px", borderRadius: "20px", backgroundColor: "#0B204010", color: "#0B2040", fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 600 }}>{ev.category ?? "미분류"}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px", whiteSpace: "nowrap" as const }}>
                                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>{formatDate(ev.date)}</span>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <span style={{ padding: "3px 10px", borderRadius: "20px", backgroundColor: STATUS_BG[ev.status ?? "APPROVED"], color: STATUS_COLOR[ev.status ?? "APPROVED"], fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700 }}>
                                            {STATUS_LABEL[ev.status ?? "APPROVED"]}
                                        </span>
                                    </td>
                                    <td style={{ padding: "14px 16px" }}>
                                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                            <button onClick={() => setEditModal(ev)}
                                                style={{ padding: "6px 12px", border: "1px solid #E8E5DF", borderRadius: "7px", background: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", cursor: "pointer", color: "#52504B", display: "flex", alignItems: "center", gap: "4px" }}>
                                                <Edit2 size={12} /> 수정
                                            </button>
                                            <button onClick={() => handleDelete(ev.id)} disabled={actionLoading === ev.id}
                                                style={{ padding: "6px 12px", border: "1px solid #FECACA", borderRadius: "7px", background: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center", gap: "4px", opacity: actionLoading === ev.id ? 0.5 : 1 }}>
                                                <Trash2 size={12} /> 삭제
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ padding: "12px 16px", borderTop: "1px solid #F0EFE9", display: "flex", justifyContent: "flex-end" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>총 {allEvents.length}개</p>
                    </div>
                </div>
            )}
        </div>
    );

    // ── 탭 콘텐츠: 행사 등록 ─────────────────────────────────────
    const renderNew = () => (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "8px" }}>New Event</p>
                <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(20px, 2.5vw, 28px)", color: "#100F0F", letterSpacing: "-0.03em" }}>행사 수동 등록</h1>
                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>관리자 직접 등록 — 즉시 공개됩니다.</p>
            </div>
            {createStatus && (
                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start", padding: "14px 18px", borderRadius: "12px", marginBottom: "24px", backgroundColor: createStatus.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${createStatus.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
                    <div style={{ color: createStatus.type === "success" ? "#16A34A" : "#DC2626", flexShrink: 0 }}>
                        {createStatus.type === "success" ? <Check size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: createStatus.type === "success" ? "#166534" : "#991B1B", fontWeight: 300 }}>{createStatus.msg}</p>
                </div>
            )}
            <form onSubmit={handleCreate}>
                <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const }}>기본 정보</p>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>행사 제목 *</label>
                            <input type="text" placeholder="예: 2026 봄 피정 프로그램" value={form.title} onChange={setField("title")} required
                                style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>카테고리</label>
                                <select value={form.category} onChange={setField("category")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>날짜·시간</label>
                                <input type="datetime-local" value={form.date} onChange={setField("date")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>장소</label>
                            <input type="text" placeholder="예: 서울 명동대성당" value={form.location} onChange={setField("location")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                        </div>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const }}>추가 정보</p>
                        <div>
                            <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>설명 (선택)</label>
                            <textarea placeholder="행사에 대한 간략한 소개" value={form.aiSummary} onChange={setField("aiSummary")} rows={3} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none", resize: "vertical", lineHeight: 1.7 }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>원본 URL</label>
                                <input type="url" placeholder="https://..." value={form.originUrl} onChange={setField("originUrl")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                            </div>
                            <div>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "6px" }}>이미지 URL</label>
                                <input type="url" placeholder="https://..." value={form.imageUrl} onChange={setField("imageUrl")} style={{ width: "100%", padding: "11px 14px", border: "1.5px solid #E8E5DF", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", outline: "none" }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "24px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.14em", color: "#9C9891", textTransform: "uppercase" as const, marginBottom: "14px" }}>테마 색상</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                            {THEME_COLORS.map(c => (
                                <button key={c.value} type="button" onClick={() => setForm(prev => ({ ...prev, themeColor: c.value }))} title={c.label}
                                    style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: c.value, border: "none", cursor: "pointer", outline: form.themeColor === c.value ? `3px solid ${c.value}` : "3px solid transparent", outlineOffset: "3px", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    {form.themeColor === c.value && <Check size={14} color="#fff" />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                        <button type="button" onClick={() => { setForm({ ...EMPTY_FORM }); setCreateStatus(null); }}
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 22px", backgroundColor: "transparent", border: "1.5px solid #D0CDC7", borderRadius: "10px", color: "#52504B", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500, cursor: "pointer" }}>
                            <RotateCcw size={14} /> 초기화
                        </button>
                        <button type="submit" disabled={createLoading}
                            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "11px 28px", backgroundColor: createLoading ? "#9C9891" : "#0B2040", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600, cursor: createLoading ? "not-allowed" : "pointer" }}>
                            {createLoading ? "등록 중..." : <><PlusCircle size={14} /> 행사 등록</>}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );

    // ── 탭 콘텐츠: 관리자 관리 ────────────────────────────────────
    const renderAdmins = () => (
        <div>
            <div style={{ marginBottom: "28px" }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.22em", color: "#C9A96E", textTransform: "uppercase" as const, marginBottom: "8px" }}>Admin Management</p>
                <h1 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "clamp(20px, 2.5vw, 28px)", color: "#100F0F", letterSpacing: "-0.03em" }}>관리자 관리</h1>
                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", marginTop: "6px", fontWeight: 300 }}>관리자 계정을 추가·삭제하고 비밀번호를 변경합니다.</p>
            </div>

            {/* 관리자 목록 */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", overflow: "hidden", marginBottom: "24px" }}>
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #E8E5DF", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const }}>관리자 목록</p>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>{adminsLoading ? "..." : `${adminsList.length}명`}</p>
                </div>
                {adminsLoading ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px" }}>불러오는 중...</div>
                ) : adminsList.length === 0 ? (
                    <div style={{ padding: "40px", textAlign: "center", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px" }}>관리자가 없습니다.</div>
                ) : (
                    <div>
                        {adminsList.map((a, i) => (
                            <div key={a.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: i < adminsList.length - 1 ? "1px solid #F0EFE9" : "none" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                                    <div style={{ width: "38px", height: "38px", borderRadius: "50%", backgroundColor: a.id === adminId ? "#0B2040" : "#F0EFE9", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <User size={16} color={a.id === adminId ? "#C9A96E" : "#9C9891"} />
                                    </div>
                                    <div>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#100F0F", fontWeight: 600 }}>{a.name}</p>
                                            {a.id === adminId && (
                                                <span style={{ padding: "2px 8px", borderRadius: "20px", backgroundColor: "#C9A96E20", color: "#C9A96E", fontFamily: "'DM Mono', monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em" }}>나</span>
                                            )}
                                        </div>
                                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891", marginTop: "2px" }}>{a.email}</p>
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#9C9891" }}>
                                        {new Date(a.createdAt).toLocaleDateString("ko-KR")}
                                    </p>
                                    {a.id !== adminId && (
                                        <button onClick={() => handleDeleteAdmin(a.id, a.name)}
                                            style={{ padding: "6px 12px", border: "1px solid #FECACA", borderRadius: "7px", background: "none", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", cursor: "pointer", color: "#DC2626", display: "flex", alignItems: "center", gap: "4px" }}>
                                            <Trash2 size={12} /> 삭제
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
                {/* 관리자 추가 */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "24px" }}>
                    <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "20px" }}>관리자 추가</p>
                    {addAdminStatus && (
                        <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "10px", marginBottom: "16px", backgroundColor: addAdminStatus.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${addAdminStatus.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
                            {addAdminStatus.type === "success" ? <Check size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: "1px" }} /> : <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: "1px" }} />}
                            <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: addAdminStatus.type === "success" ? "#166534" : "#991B1B", fontWeight: 300 }}>{addAdminStatus.msg}</p>
                        </div>
                    )}
                    <form onSubmit={handleAddAdmin} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                            { key: "name", label: "이름", type: "text", placeholder: "홍길동" },
                            { key: "email", label: "이메일", type: "email", placeholder: "admin@example.com" },
                            { key: "password", label: "비밀번호 (6자 이상)", type: "password", placeholder: "••••••••" },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "5px" }}>{f.label}</label>
                                <input type={f.type} placeholder={f.placeholder}
                                    value={newAdminForm[f.key as keyof typeof newAdminForm]}
                                    onChange={e => setNewAdminForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    required
                                    style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E8E5DF", borderRadius: "9px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", outline: "none" }} />
                            </div>
                        ))}
                        <button type="submit" disabled={addAdminLoading}
                            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", backgroundColor: addAdminLoading ? "#9C9891" : "#0B2040", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, cursor: addAdminLoading ? "not-allowed" : "pointer", marginTop: "4px" }}>
                            {addAdminLoading ? "추가 중..." : <><PlusCircle size={13} /> 관리자 추가</>}
                        </button>
                    </form>
                </div>

                {/* 내 비밀번호 변경 */}
                <div style={{ backgroundColor: "#FFFFFF", borderRadius: "16px", border: "1px solid #E8E5DF", padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", letterSpacing: "0.14em", color: "#52504B", textTransform: "uppercase" as const }}>내 비밀번호 변경</p>
                        <button onClick={() => { setShowChangePw(v => !v); setChangePwStatus(null); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                            <KeyRound size={13} /> {showChangePw ? "취소" : "변경하기"}
                        </button>
                    </div>
                    <div style={{ padding: "12px 16px", backgroundColor: "#F8F7F4", borderRadius: "10px", marginBottom: showChangePw ? "16px" : "0" }}>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "#9C9891", marginBottom: "4px" }}>현재 계정</p>
                        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#100F0F", fontWeight: 600 }}>{adminName}</p>
                        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891", marginTop: "2px" }}>{adminEmail}</p>
                    </div>
                    {showChangePw && (
                        <>
                            {changePwStatus && (
                                <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", padding: "12px 14px", borderRadius: "10px", marginBottom: "16px", backgroundColor: changePwStatus.type === "success" ? "#F0FDF4" : "#FEF2F2", border: `1px solid ${changePwStatus.type === "success" ? "#BBF7D0" : "#FECACA"}` }}>
                                    {changePwStatus.type === "success" ? <Check size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: "1px" }} /> : <AlertCircle size={14} color="#DC2626" style={{ flexShrink: 0, marginTop: "1px" }} />}
                                    <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", color: changePwStatus.type === "success" ? "#166534" : "#991B1B", fontWeight: 300 }}>{changePwStatus.msg}</p>
                                </div>
                            )}
                            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                {[
                                    { key: "oldPassword", label: "현재 비밀번호", placeholder: "••••••••" },
                                    { key: "newPassword", label: "새 비밀번호 (6자 이상)", placeholder: "••••••••" },
                                ].map(f => (
                                    <div key={f.key}>
                                        <label style={{ display: "block", fontFamily: "'DM Mono', monospace", fontSize: "10px", letterSpacing: "0.12em", color: "#52504B", textTransform: "uppercase" as const, marginBottom: "5px" }}>{f.label}</label>
                                        <input type="password" placeholder={f.placeholder}
                                            value={changePwForm[f.key as keyof typeof changePwForm]}
                                            onChange={e => setChangePwForm(p => ({ ...p, [f.key]: e.target.value }))}
                                            required
                                            style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #E8E5DF", borderRadius: "9px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", outline: "none" }} />
                                    </div>
                                ))}
                                <button type="submit" disabled={changePwLoading}
                                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", padding: "11px", backgroundColor: changePwLoading ? "#9C9891" : "#1A6B40", color: "#fff", border: "none", borderRadius: "10px", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, cursor: changePwLoading ? "not-allowed" : "pointer" }}>
                                    {changePwLoading ? "변경 중..." : <><KeyRound size={13} /> 비밀번호 변경</>}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    // ── 메인 레이아웃 ────────────────────────────────────────────
    return (
        <>
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                .adm-layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
                @media (max-width: 860px) { .adm-layout { grid-template-columns: 1fr; } .adm-sidebar { display: none; } }
            `}</style>

            <div className="adm-layout">
                {/* 사이드바 */}
                <aside className="adm-sidebar" style={{ backgroundColor: "#0B2040", display: "flex", flexDirection: "column", padding: "32px 24px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
                    <div style={{ marginBottom: "28px" }}>
                        <Logo variant="light" size={34} />
                        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "9px", letterSpacing: "0.18em", color: "#C9A96E", textTransform: "uppercase" as const }}>Admin Panel</p>
                            <h2 style={{ fontFamily: "'Noto Serif KR', serif", fontWeight: 900, fontSize: "16px", color: "#FFFFFF", marginTop: "5px" }}>관리자 패널</h2>
                        </div>
                    </div>

                    {/* 로그인 정보 */}
                    <div style={{ padding: "12px 14px", backgroundColor: "rgba(201,169,110,0.1)", borderRadius: "10px", border: "1px solid rgba(201,169,110,0.2)", marginBottom: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "rgba(201,169,110,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <User size={13} color="#C9A96E" />
                            </div>
                            <div style={{ overflow: "hidden" }}>
                                <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#FFFFFF", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminName}</p>
                                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "10px", color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{adminEmail}</p>
                            </div>
                        </div>
                    </div>

                    <nav style={{ display: "flex", flexDirection: "column", gap: "3px", marginBottom: "auto" }}>
                        {NAV_ITEMS.map(item => {
                            const active = activeTab === item.id;
                            return (
                                <button key={item.id} onClick={() => setActiveTab(item.id)}
                                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "10px", backgroundColor: active ? "rgba(201,169,110,0.12)" : "transparent", border: "none", cursor: "pointer", textAlign: "left" as const, transition: "background 0.15s", width: "100%" }}>
                                    <span style={{ color: active ? "#C9A96E" : "rgba(255,255,255,0.4)" }}>{item.icon}</span>
                                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: active ? "#FFFFFF" : "rgba(255,255,255,0.5)", fontWeight: active ? 500 : 300, flex: 1 }}>{item.label}</span>
                                    {item.badge !== undefined && (
                                        <span style={{ padding: "2px 8px", borderRadius: "20px", backgroundColor: "#DC2626", color: "#fff", fontFamily: "'DM Mono', monospace", fontSize: "10px", fontWeight: 700 }}>{item.badge}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    <button onClick={handleLogout}
                        style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "24px", padding: "11px 14px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "rgba(255,255,255,0.4)", fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", cursor: "pointer", width: "100%" }}>
                        <LogOut size={14} /> 로그아웃
                    </button>
                </aside>

                {/* 메인 콘텐츠 */}
                <main style={{ backgroundColor: "#F8F7F4", padding: "clamp(24px, 4vw, 44px)", overflowY: "auto" }}>
                    {activeTab === "pending" && renderPending()}
                    {activeTab === "list" && renderList()}
                    {activeTab === "new" && renderNew()}
                    {activeTab === "admins" && renderAdmins()}
                </main>
            </div>

            {/* 수정 모달 */}
            {editModal && (
                <EditModal event={editModal} adminToken={adminToken} onClose={() => setEditModal(null)}
                    onSaved={() => { if (activeTab === "pending") fetchPending(); else fetchAll(); }} />
            )}

            {/* 거절 모달 */}
            {rejectModal && (
                <RejectModal id={rejectModal.id} title={rejectModal.title} adminToken={adminToken}
                    onClose={() => setRejectModal(null)}
                    onRejected={() => { fetchPending(); if (activeTab === "list") fetchAll(); }} />
            )}
        </>
    );
}
