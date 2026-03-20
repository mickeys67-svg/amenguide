"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, Shield, ShieldCheck } from "lucide-react";
import { apiFetch } from "@/utils/api";
import { useAuth } from "@/hooks/useAuth";
import { COMMUNITY_CATEGORIES, GRACE_LEVELS } from "@/types/community";
import type { GraceLevel } from "@/types/community";
import { Navigation } from "@/components/main/Navigation";

const DIOCESES = [
  "서울대교구", "수원교구", "인천교구", "의정부교구",
  "대전교구", "청주교구", "춘천교구", "원주교구",
  "대구대교구", "부산교구", "마산교구", "안동교구",
  "광주대교구", "전주교구", "제주교구", "군종교구",
];

export default function CommunityWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("자유게시판");
  const [diocese, setDiocese] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { authUser, mounted, getToken } = useAuth();
  const [graceLevel, setGraceLevel] = useState<GraceLevel | null>(null);

  useEffect(() => {
    if (!mounted) return;
    if (!authUser) {
      router.push("/login");
      return;
    }
    apiFetch<GraceLevel>(`/community/grace/${authUser.id}`)
      .then(setGraceLevel)
      .catch(() => {});
  }, [authUser, mounted, router]);

  const handleSubmit = async () => {
    if (!title.trim()) { setError("제목을 입력해주세요."); return; }
    if (!content.trim()) { setError("내용을 입력해주세요."); return; }
    if (title.trim().length > 100) { setError("제목은 100자 이내로 입력해주세요."); return; }
    if (content.trim().length > 10000) { setError("내용은 10,000자 이내로 입력해주세요."); return; }

    setSubmitting(true);
    setError("");
    try {
      const token = getToken();
      if (!token) { router.push("/login"); return; }
      const res = await apiFetch<{ id: string; moderationNotice?: string }>("/community", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          diocese: diocese || undefined,
        }),
      });
      if (res.moderationNotice) {
        // PENDING 상태 — 검토 대기 안내 후 목록으로
        alert(res.moderationNotice);
        router.push("/community");
      } else {
        router.push(`/community/${res.id}`);
      }
    } catch (err: any) {
      setError(err.message || "글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authUser) return null;

  return (
    <>
      <Navigation />
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px" }}>
        <div className="sacred-rail" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 72px)" }}>

          {/* ── 뒤로가기 ── */}
          <div style={{ marginBottom: "24px" }}>
            <a
              href="/community"
              style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                color: "#9C9891", textDecoration: "none",
              }}
            >
              <ChevronLeft size={14} />Cenaculum으로 돌아가기
            </a>
          </div>

          {/* ── 글쓰기 카드 ── */}
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #E8E5DF", padding: "clamp(24px, 4vw, 40px)",
          }}>
            <h1 style={{
              fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(20px, 3.5vw, 26px)",
              fontWeight: 700, color: "#0B2040", margin: "0 0 24px 0",
            }}>
              새 글 쓰기
            </h1>

            {/* 은총 등급 + 승인 정책 안내 */}
            {graceLevel && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: "12px",
                padding: "14px 18px", borderRadius: "10px", marginBottom: "24px",
                backgroundColor: graceLevel.level >= 3 ? "rgba(26,107,64,0.05)" : "rgba(201,169,110,0.08)",
                border: `1px solid ${graceLevel.level >= 3 ? "rgba(26,107,64,0.15)" : "rgba(201,169,110,0.2)"}`,
              }}>
                {graceLevel.level >= 3 ? (
                  <ShieldCheck size={18} color="#1A6B40" style={{ flexShrink: 0, marginTop: "1px" }} />
                ) : (
                  <Shield size={18} color="#8B6914" style={{ flexShrink: 0, marginTop: "1px" }} />
                )}
                <div>
                  <div style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                    fontWeight: 600, color: "#0B2040", marginBottom: "4px",
                  }}>
                    {graceLevel.icon} {graceLevel.title}
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "11px",
                      color: "#9C9891", marginLeft: "8px",
                    }}>
                      Lv.{graceLevel.level} · {graceLevel.gracePoints}pt
                    </span>
                  </div>
                  <div style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                    color: graceLevel.level >= 3 ? "#1A6B40" : "#8B6914",
                    lineHeight: 1.6,
                  }}>
                    {graceLevel.level >= 3 ? (
                      "AI 검토를 거쳐 자동으로 게시됩니다."
                    ) : (
                      <>
                        AI 검토 후 <strong>관리자 승인</strong>을 거쳐 게시됩니다.
                        <br />
                        <span style={{ fontSize: "11px", color: "#9C9891" }}>
                          활발한 활동으로 Lv.3 이상이 되면 자동 승인됩니다.
                          (글 10pt · 댓글 3pt · 받은 리액션 2pt)
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 카테고리 선택 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
              }}>
                카테고리
              </label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {COMMUNITY_CATEGORIES.filter(c => c.id !== "전체").map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "7px 14px", borderRadius: "20px",
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                      fontWeight: category === cat.id ? 600 : 400,
                      backgroundColor: category === cat.id ? "#0B2040" : "rgba(11,32,64,0.05)",
                      color: category === cat.id ? "#FFFFFF" : "#52504B",
                      border: "none", cursor: "pointer", transition: "all 0.15s",
                    }}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 교구 선택 (선택사항) */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
              }}>
                교구 <span style={{ fontWeight: 400, color: "#9C9891" }}>(선택)</span>
              </label>
              <select
                value={diocese}
                onChange={(e) => setDiocese(e.target.value)}
                style={{
                  padding: "10px 14px", borderRadius: "8px",
                  border: "1px solid #E8E5DF", backgroundColor: "#FAFAF8",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  color: diocese ? "#100F0F" : "#9C9891",
                  outline: "none", minWidth: "200px",
                }}
              >
                <option value="">교구 선택 안함</option>
                {DIOCESES.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* 제목 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
              }}>
                제목
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목을 입력해주세요 (100자 이내)"
                maxLength={100}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: "8px",
                  border: "1px solid #E8E5DF", backgroundColor: "#FAFAF8",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
                  color: "#100F0F", outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "11px",
                color: title.length > 90 ? "#DC2626" : "#9C9891",
                float: "right", marginTop: "4px",
              }}>
                {title.length}/100
              </span>
            </div>

            {/* 내용 */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                fontWeight: 600, color: "#52504B", display: "block", marginBottom: "8px",
              }}>
                내용
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="나누고 싶은 이야기를 적어주세요..."
                maxLength={10000}
                rows={12}
                style={{
                  width: "100%", padding: "14px 16px", borderRadius: "8px",
                  border: "1px solid #E8E5DF", backgroundColor: "#FAFAF8",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
                  color: "#100F0F", outline: "none", resize: "vertical",
                  lineHeight: 1.8, boxSizing: "border-box",
                }}
              />
              <span style={{
                fontFamily: "'DM Mono', monospace", fontSize: "11px",
                color: content.length > 9500 ? "#DC2626" : "#9C9891",
                float: "right", marginTop: "4px",
              }}>
                {content.length}/10,000
              </span>
            </div>

            {/* 에러 */}
            {error && (
              <div style={{
                padding: "12px 16px", borderRadius: "8px", marginBottom: "16px",
                backgroundColor: "rgba(220,38,38,0.06)", color: "#DC2626",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
              }}>
                {error}
              </div>
            )}

            {/* 제출 */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => router.push("/community")}
                style={{
                  padding: "12px 24px", borderRadius: "8px",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  fontWeight: 500, backgroundColor: "transparent",
                  color: "#52504B", border: "1px solid #E8E5DF",
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "12px 28px", borderRadius: "8px",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  fontWeight: 600,
                  backgroundColor: submitting ? "#9C9891" : "#0B2040",
                  color: "#FFFFFF", border: "none",
                  cursor: submitting ? "default" : "pointer",
                  transition: "background 0.15s",
                }}
              >
                <Send size={14} />
                {submitting ? "작성 중..." : "글 올리기"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
