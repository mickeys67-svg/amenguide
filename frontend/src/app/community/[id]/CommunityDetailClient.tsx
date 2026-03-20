"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Eye, MessageSquare, Clock, Send, CornerDownRight, Trash2,
} from "lucide-react";
import { apiFetch } from "@/utils/api";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/hooks/useAuth";
import type { CommunityPost, CommunityComment, ReactionType } from "@/types/community";
import { COMMUNITY_CATEGORIES, REACTION_TYPES } from "@/types/community";
import { Navigation } from "@/components/main/Navigation";

export default function CommunityDetailClient({ postId }: { postId: string }) {
  const router = useRouter();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { authUser, getToken } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPost = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await apiFetch<CommunityPost>(`/community/${postId}`, { headers, signal });
      setPost(res);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Failed to fetch post:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [postId, getToken]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPost(controller.signal);
    return () => controller.abort();
  }, [fetchPost]);

  // ── 리액션 토글 ─────────────────────────────────────────────────
  const handleReaction = async (type: ReactionType, targetPostId?: string, targetCommentId?: string) => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }
    try {
      await apiFetch("/community/reactions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          postId: targetPostId || undefined,
          commentId: targetCommentId || undefined,
        }),
      });
      fetchPost(); // 리프레시
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  };

  // ── 댓글 작성 ───────────────────────────────────────────────────
  const handleComment = async (parentId?: string) => {
    const token = getToken();
    if (!token) { router.push("/login"); return; }

    const content = parentId ? replyText : commentText;
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await apiFetch(`/community/${postId}/comments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), parentId }),
      });
      if (parentId) { setReplyText(""); setReplyTo(null); }
      else setCommentText("");
      fetchPost();
    } catch (err) {
      console.error("Comment failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 게시글 삭제 ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    const token = getToken();
    if (!token) return;
    try {
      await apiFetch(`/community/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      router.push("/community");
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const categoryInfo = post ? COMMUNITY_CATEGORIES.find(c => c.id === post.category) : null;

  if (loading) {
    return (
      <>
        <Navigation />
        <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "#9C9891" }}>불러오는 중...</p>
        </div>
      </>
    );
  }

  if (!post) {
    return (
      <>
        <Navigation />
        <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "'Noto Sans KR', sans-serif", color: "#9C9891" }}>게시글을 찾을 수 없습니다.</p>
        </div>
      </>
    );
  }

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
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#C9A96E"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9C9891"}
            >
              <ChevronLeft size={14} />Cenaculum 목록
            </a>
          </div>

          {/* ── 게시글 카드 ── */}
          <article style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #E8E5DF", padding: "clamp(24px, 4vw, 40px)",
            marginBottom: "24px",
          }}>
            {/* 카테고리 + 메타 */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: "4px",
                padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 600,
                fontFamily: "'Noto Sans KR', sans-serif",
                backgroundColor: "rgba(11,32,64,0.06)", color: "#0B2040",
              }}>
                {categoryInfo?.icon || "💬"} {post.category}
              </span>
              {post.diocese && (
                <span style={{
                  padding: "4px 10px", borderRadius: "6px", fontSize: "12px",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  backgroundColor: "rgba(201,169,110,0.08)", color: "#8B6914",
                }}>
                  {post.diocese}
                </span>
              )}
              {post.isPinned && (
                <span style={{ fontSize: "12px", color: "#C9A96E" }}>📌 고정</span>
              )}
            </div>

            {/* 제목 */}
            <h1 style={{
              fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(20px, 3.5vw, 28px)",
              fontWeight: 700, color: "#0B2040", margin: "0 0 16px 0", lineHeight: 1.4,
            }}>
              {post.title}
            </h1>

            {/* 작성자 + 메타 */}
            <div style={{
              display: "flex", alignItems: "center", gap: "16px",
              paddingBottom: "20px", borderBottom: "1px solid #F0EFE9",
              marginBottom: "24px", flexWrap: "wrap",
            }}>
              <span style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                fontWeight: 500, color: "#100F0F",
              }}>
                {post.author?.name || "익명"}
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
              }}>
                <Clock size={12} /> {formatDate(post.createdAt)}
              </span>
              <span style={{
                display: "flex", alignItems: "center", gap: "4px",
                fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
              }}>
                <Eye size={12} /> {post.viewCount}
              </span>
              {authUser && post.authorId === authUser.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "4px 10px", borderRadius: "6px",
                    fontSize: "12px", color: "#DC2626",
                    backgroundColor: "rgba(220,38,38,0.06)",
                    border: "none", cursor: "pointer",
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  <Trash2 size={12} /> 삭제
                </button>
              )}
            </div>

            {/* 본문 */}
            <div style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "15px",
              color: "#100F0F", lineHeight: 1.85,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {post.content}
            </div>

            {/* ── 리액션 바 ── */}
            <div style={{
              display: "flex", gap: "8px", marginTop: "32px",
              paddingTop: "20px", borderTop: "1px solid #F0EFE9",
              flexWrap: "wrap",
            }}>
              {REACTION_TYPES.map(({ type, emoji, label }) => {
                const info = post.reactionSummary?.[type];
                const count = info?.count || 0;
                const mine = info?.mine || false;
                return (
                  <button
                    key={type}
                    type="button"
                    title={label}
                    onClick={() => handleReaction(type, post.id)}
                    style={{
                      display: "flex", alignItems: "center", gap: "6px",
                      padding: "8px 14px", borderRadius: "20px",
                      fontSize: "13px", fontFamily: "'Noto Sans KR', sans-serif",
                      backgroundColor: mine ? "rgba(201,169,110,0.12)" : "rgba(11,32,64,0.04)",
                      color: mine ? "#8B6914" : "#52504B",
                      border: mine ? "1.5px solid rgba(201,169,110,0.3)" : "1px solid transparent",
                      cursor: "pointer", transition: "all 0.15s",
                      fontWeight: mine ? 600 : 400,
                    }}
                  >
                    <span style={{ fontSize: "16px" }}>{emoji}</span>
                    {label}
                    {count > 0 && (
                      <span style={{
                        fontFamily: "'DM Mono', monospace", fontSize: "12px",
                        fontWeight: 700,
                      }}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </article>

          {/* ── 댓글 섹션 ── */}
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #E8E5DF", padding: "clamp(20px, 4vw, 32px)",
          }}>
            <h2 style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "16px",
              fontWeight: 700, color: "#0B2040", margin: "0 0 20px 0",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <MessageSquare size={18} />
              나눔 {post.comments?.length || 0}
            </h2>

            {/* 댓글 입력 */}
            {!post.isClosed ? (
              <div style={{
                display: "flex", gap: "8px", marginBottom: "24px",
              }}>
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !submitting && handleComment()}
                  placeholder={authUser ? "나눔을 남겨주세요..." : "로그인 후 댓글을 남길 수 있습니다."}
                  disabled={!authUser}
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: "8px",
                    border: "1px solid #E8E5DF", backgroundColor: "#FAFAF8",
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                    color: "#100F0F", outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleComment()}
                  disabled={!authUser || submitting || !commentText.trim()}
                  style={{
                    width: "44px", height: "44px", borderRadius: "8px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: commentText.trim() && authUser ? "#0B2040" : "#E8E5DF",
                    color: commentText.trim() && authUser ? "#FFFFFF" : "#9C9891",
                    border: "none", cursor: commentText.trim() && authUser ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}
                >
                  <Send size={16} />
                </button>
              </div>
            ) : (
              <div style={{
                padding: "16px", borderRadius: "8px", marginBottom: "24px",
                backgroundColor: "rgba(11,32,64,0.04)",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                color: "#9C9891", textAlign: "center",
              }}>
                🔒 댓글이 잠겨있습니다.
              </div>
            )}

            {/* 댓글 목록 */}
            {(post.comments || []).map((comment: CommunityComment) => (
              <div key={comment.id} style={{ marginBottom: "16px" }}>
                {/* 부모 댓글 */}
                <div style={{
                  padding: "14px 16px", borderRadius: "10px",
                  backgroundColor: "#FAFAF8", border: "1px solid #F0EFE9",
                }}>
                  <div style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    marginBottom: "8px",
                  }}>
                    <span style={{
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                      fontWeight: 600, color: "#0B2040",
                    }}>
                      {comment.author?.name || "익명"}
                    </span>
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891",
                    }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                    color: "#100F0F", lineHeight: 1.7, margin: 0,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {comment.content}
                  </p>

                  {/* 댓글 리액션 + 답글 버튼 */}
                  <div style={{
                    display: "flex", gap: "6px", marginTop: "10px", alignItems: "center", flexWrap: "wrap",
                  }}>
                    {REACTION_TYPES.slice(0, 3).map(({ type, emoji }) => {
                      const info = comment.reactionSummary?.[type];
                      const count = info?.count || 0;
                      const mine = info?.mine || false;
                      if (count === 0 && !mine) return null;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleReaction(type as ReactionType, undefined, comment.id)}
                          style={{
                            display: "flex", alignItems: "center", gap: "3px",
                            padding: "3px 8px", borderRadius: "12px",
                            fontSize: "12px",
                            backgroundColor: mine ? "rgba(201,169,110,0.12)" : "rgba(11,32,64,0.04)",
                            color: mine ? "#8B6914" : "#9C9891",
                            border: "none", cursor: "pointer",
                          }}
                        >
                          {emoji} {count}
                        </button>
                      );
                    })}
                    {!post.isClosed && authUser && (
                      <button
                        type="button"
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        style={{
                          display: "flex", alignItems: "center", gap: "4px",
                          padding: "3px 8px", borderRadius: "12px",
                          fontSize: "12px", fontFamily: "'Noto Sans KR', sans-serif",
                          backgroundColor: "transparent", color: "#9C9891",
                          border: "none", cursor: "pointer",
                        }}
                      >
                        <CornerDownRight size={12} /> 답글
                      </button>
                    )}
                  </div>
                </div>

                {/* 답글 목록 */}
                {comment.replies && comment.replies.length > 0 && (
                  <div style={{ marginLeft: "24px", marginTop: "8px" }}>
                    {comment.replies.map((reply: CommunityComment) => (
                      <div key={reply.id} style={{
                        padding: "12px 14px", borderRadius: "8px",
                        backgroundColor: "#FFFFFF", border: "1px solid #F0EFE9",
                        marginBottom: "6px",
                      }}>
                        <div style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          marginBottom: "6px",
                        }}>
                          <span style={{
                            display: "flex", alignItems: "center", gap: "6px",
                          }}>
                            <CornerDownRight size={12} color="#C9A96E" />
                            <span style={{
                              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                              fontWeight: 600, color: "#0B2040",
                            }}>
                              {reply.author?.name || "익명"}
                            </span>
                          </span>
                          <span style={{
                            fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#9C9891",
                          }}>
                            {formatDate(reply.createdAt)}
                          </span>
                        </div>
                        <p style={{
                          fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                          color: "#100F0F", lineHeight: 1.7, margin: 0,
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                        }}>
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 답글 입력 */}
                {replyTo === comment.id && (
                  <div style={{
                    marginLeft: "24px", marginTop: "8px",
                    display: "flex", gap: "8px",
                  }}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !submitting && handleComment(comment.id)}
                      placeholder="답글을 남겨주세요..."
                      autoFocus
                      style={{
                        flex: 1, padding: "10px 14px", borderRadius: "8px",
                        border: "1px solid #E8E5DF", backgroundColor: "#FFFFFF",
                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                        color: "#100F0F", outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleComment(comment.id)}
                      disabled={submitting || !replyText.trim()}
                      style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        backgroundColor: replyText.trim() ? "#0B2040" : "#E8E5DF",
                        color: replyText.trim() ? "#FFFFFF" : "#9C9891",
                        border: "none", cursor: replyText.trim() ? "pointer" : "default",
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}

            {(!post.comments || post.comments.length === 0) && (
              <div style={{
                padding: "32px", textAlign: "center",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", color: "#9C9891",
              }}>
                아직 나눔이 없습니다. 첫 번째로 나눔을 남겨주세요!
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
