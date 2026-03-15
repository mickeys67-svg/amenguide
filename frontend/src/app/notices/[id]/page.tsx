"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Eye, Calendar, User, Paperclip, Send, Download } from "lucide-react";
import { apiFetch } from "@/utils/api";
import type { Notice, NoticeComment } from "@/types/notice";
import { Navigation } from "@/components/main/Navigation";

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "일반": { bg: "rgba(11,32,64,0.06)", text: "#0B2040" },
  "공지": { bg: "rgba(26,107,64,0.08)", text: "#1A6B40" },
  "긴급": { bg: "rgba(200,58,30,0.08)", text: "#C83A1E" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function NoticeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [authUser, setAuthUser] = useState<{ id: string; name: string } | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      const token = localStorage.getItem("authToken");
      if (raw) setAuthUser(JSON.parse(raw));
      if (token) setAuthToken(token);
    } catch {}
  }, []);

  const fetchNotice = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<Notice>(`/notices/${id}`);
      setNotice(res);
    } catch {
      setNotice(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchNotice(); }, [fetchNotice]);

  const handleComment = async () => {
    if (!commentText.trim() || !authToken || submitting) return;
    setSubmitting(true);
    try {
      const newComment = await apiFetch<NoticeComment>(`/notices/${id}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      setNotice((prev) => prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : prev);
      setCommentText("");
    } catch (err) {
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "#9C9891" }}>불러오는 중...</p>
      </div>
    );
  }

  if (!notice) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "16px", color: "#52504B", marginBottom: "16px" }}>
            글을 찾을 수 없습니다.
          </p>
          <button
            type="button"
            onClick={() => router.push("/notices")}
            style={{
              padding: "10px 20px", borderRadius: "8px",
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
              backgroundColor: "#0B2040", color: "#FFFFFF",
              border: "none", cursor: "pointer",
            }}
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const catColor = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS["일반"];

  return (
    <>
    <Navigation />
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px" }}>
      <div className="sacred-rail" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 72px)" }}>

        {/* ── 뒤로가기 ── */}
        <button
          type="button"
          onClick={() => router.push("/notices")}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
            color: "#9C9891", background: "none", border: "none",
            cursor: "pointer", marginBottom: "24px", padding: 0,
          }}
        >
          <ArrowLeft size={14} strokeWidth={2} />
          목록으로
        </button>

        {/* ── 글 본문 ── */}
        <article style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #E8E5DF", padding: "clamp(24px, 4vw, 40px)",
        }}>
          {/* 카테고리 + 제목 */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{
              display: "inline-block", padding: "3px 10px", borderRadius: "4px",
              fontSize: "12px", fontWeight: 600, fontFamily: "'DM Mono', monospace",
              backgroundColor: catColor.bg, color: catColor.text,
              marginBottom: "12px",
            }}>
              {notice.category}
            </span>
            <h1 style={{
              fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(20px, 3.5vw, 28px)",
              fontWeight: 900, color: "#0B2040", margin: 0, lineHeight: 1.4,
            }}>
              {notice.title}
            </h1>
          </div>

          {/* 메타 정보 */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: "16px",
            paddingBottom: "20px", borderBottom: "1px solid #F0EFE9",
            marginBottom: "28px",
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#52504B", fontFamily: "'Noto Sans KR', sans-serif" }}>
              <User size={13} strokeWidth={2} color="#9C9891" />
              {notice.author?.name || "익명"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#9C9891", fontFamily: "'DM Mono', monospace" }}>
              <Calendar size={13} strokeWidth={2} />
              {formatDate(notice.createdAt)}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "13px", color: "#9C9891", fontFamily: "'DM Mono', monospace" }}>
              <Eye size={13} strokeWidth={2} />
              {notice.viewCount}
            </span>
          </div>

          {/* 본문 */}
          <div style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
            lineHeight: 1.8, color: "#100F0F",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            minHeight: "120px",
          }}>
            {notice.content}
          </div>

          {/* 첨부파일 */}
          {notice.attachments && notice.attachments.length > 0 && (
            <div style={{
              marginTop: "28px", paddingTop: "20px",
              borderTop: "1px solid #F0EFE9",
            }}>
              <h3 style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                fontWeight: 600, color: "#52504B", marginBottom: "12px",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <Paperclip size={13} strokeWidth={2} />
                첨부파일 ({notice.attachments.length})
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {notice.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "10px 14px", borderRadius: "8px",
                      backgroundColor: "#FAFAF8", border: "1px solid #F0EFE9",
                      textDecoration: "none", transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#F0EFE9"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#FAFAF8"}
                  >
                    <Download size={14} strokeWidth={2} color="#52504B" />
                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#0B2040", flex: 1 }}>
                      {att.fileName}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>
                      {formatFileSize(att.fileSize)}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* ── 댓글 섹션 ── */}
        <div style={{
          marginTop: "24px", backgroundColor: "#FFFFFF",
          borderRadius: "12px", border: "1px solid #E8E5DF",
          padding: "clamp(20px, 3vw, 32px)",
        }}>
          <h3 style={{
            fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
            fontWeight: 600, color: "#0B2040", marginBottom: "20px",
          }}>
            댓글 {notice.comments?.length || 0}
          </h3>

          {/* 댓글 목록 */}
          {notice.comments && notice.comments.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {notice.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: "14px 0",
                    borderBottom: "1px solid #F0EFE9",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600, color: "#0B2040" }}>
                      {comment.author?.name || "익명"}
                    </span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891" }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                    color: "#100F0F", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap",
                  }}>
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
              color: "#9C9891", textAlign: "center", padding: "20px 0",
            }}>
              첫 댓글을 작성해보세요.
            </p>
          )}

          {/* 댓글 작성 */}
          {authUser ? (
            <div style={{
              marginTop: "20px", display: "flex", gap: "10px",
              alignItems: "flex-end",
            }}>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={2}
                style={{
                  flex: 1, padding: "12px 14px", borderRadius: "8px",
                  border: "1.5px solid #E8E5DF", outline: "none",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  color: "#100F0F", resize: "vertical", minHeight: "48px",
                  backgroundColor: "#FAFAF8",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#0B2040"}
                onBlur={e => (e.currentTarget as HTMLTextAreaElement).style.borderColor = "#E8E5DF"}
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={!commentText.trim() || submitting}
                style={{
                  padding: "12px 16px", borderRadius: "8px",
                  backgroundColor: commentText.trim() ? "#0B2040" : "#D0CDC7",
                  color: "#FFFFFF", border: "none",
                  cursor: commentText.trim() ? "pointer" : "default",
                  display: "flex", alignItems: "center", gap: "6px",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 600,
                  transition: "background 0.15s", flexShrink: 0,
                }}
              >
                <Send size={14} strokeWidth={2} />
                {submitting ? "..." : "등록"}
              </button>
            </div>
          ) : (
            <div style={{
              marginTop: "20px", textAlign: "center", padding: "16px",
              backgroundColor: "#FAFAF8", borderRadius: "8px",
            }}>
              <p style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#9C9891", margin: 0 }}>
                댓글을 작성하려면{" "}
                <button
                  type="button"
                  onClick={() => router.push("/login")}
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                    color: "#0B2040", fontWeight: 600, background: "none",
                    border: "none", cursor: "pointer", textDecoration: "underline",
                    padding: 0,
                  }}
                >
                  로그인
                </button>
                이 필요합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
