"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pin, MessageSquare, Eye, PenLine } from "lucide-react";
import { apiFetch } from "@/utils/api";
import type { Notice, NoticeListResponse } from "@/types/notice";
import { Navigation } from "@/components/main/Navigation";

const CATEGORIES = ["전체", "일반", "공지", "긴급"] as const;

const NOTICE_RESPONSIVE_STYLE = `
  .notice-grid-header, .notice-grid-row {
    display: grid;
    grid-template-columns: 80px 1fr 120px 80px 80px;
  }
  .notice-col-author, .notice-col-views { display: block; }
  @media (max-width: 767px) {
    .notice-grid-header { display: none; }
    .notice-grid-row {
      grid-template-columns: auto 1fr auto;
      gap: 4px;
    }
    .notice-col-author, .notice-col-views { display: none; }
  }
`;

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "일반": { bg: "rgba(11,32,64,0.06)", text: "#0B2040", border: "rgba(11,32,64,0.12)" },
  "공지": { bg: "rgba(26,107,64,0.08)", text: "#1A6B40", border: "rgba(26,107,64,0.18)" },
  "긴급": { bg: "rgba(200,58,30,0.08)", text: "#C83A1E", border: "rgba(200,58,30,0.18)" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function NoticesListClient() {
  const router = useRouter();
  const [data, setData] = useState<Notice[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("authUser");
      if (raw) setAuthUser(JSON.parse(raw));
    } catch {}
  }, []);

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (category !== "전체") params.set("category", category);
      const res = await apiFetch<NoticeListResponse>(`/notices?${params}`);
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err) {
      console.error("Failed to fetch notices:", err);
    } finally {
      setLoading(false);
    }
  }, [page, category]);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  return (
    <>
    <Navigation />
    <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px" }}>
      <style>{NOTICE_RESPONSIVE_STYLE}</style>
      <div className="sacred-rail" style={{ padding: "clamp(24px, 5vw, 48px) clamp(20px, 4vw, 72px)" }}>

        {/* ── 홈 링크 ── */}
        <div style={{ marginBottom: "16px" }}>
          <a
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
              color: "#9C9891", textDecoration: "none", transition: "color 0.15s",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#C9A96E"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9C9891"}
          >
            <ChevronLeft size={14} />홈
          </a>
        </div>

        {/* ── 헤더 ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "32px" }}>
          <div>
            <h1 style={{
              fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(24px, 4vw, 32px)",
              fontWeight: 900, color: "#0B2040", margin: 0, lineHeight: 1.3,
            }}>
              공지사항
            </h1>
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
              color: "#9C9891", marginTop: "6px",
            }}>
              전체 {total}건
            </p>
          </div>
          {authUser && (
            <button
              type="button"
              onClick={() => router.push("/notices/write")}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "10px 20px", borderRadius: "8px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 600,
                backgroundColor: "#0B2040", color: "#FFFFFF",
                border: "none", cursor: "pointer", transition: "background 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#183568"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = "#0B2040"}
            >
              <PenLine size={14} strokeWidth={2} />
              글쓰기
            </button>
          )}
        </div>

        {/* ── 카테고리 필터 ── */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => { setCategory(cat); setPage(1); }}
              style={{
                padding: "7px 16px", borderRadius: "20px",
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500,
                backgroundColor: category === cat ? "#0B2040" : "rgba(11,32,64,0.05)",
                color: category === cat ? "#FFFFFF" : "#52504B",
                border: "none", cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── 목록 ── */}
        <div style={{
          backgroundColor: "#FFFFFF", borderRadius: "12px",
          border: "1px solid #E8E5DF", overflow: "hidden",
        }}>
          {/* 테이블 헤더 */}
          <div className="notice-grid-header" style={{
            padding: "12px 20px",
            borderBottom: "1px solid #E8E5DF",
            backgroundColor: "#FAFAF8",
          }}>
            {["분류", "제목", "작성자", "날짜", "조회"].map((h, i) => (
              <span key={h} className={i === 2 ? "notice-col-author" : i === 4 ? "notice-col-views" : undefined} style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                fontWeight: 600, color: "#9C9891", textTransform: "uppercase",
              }}>
                {h}
              </span>
            ))}
          </div>

          {loading ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif" }}>
              불러오는 중...
            </div>
          ) : data.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif" }}>
              게시글이 없습니다.
            </div>
          ) : (
            data.map((notice) => {
              const catColor = CATEGORY_COLORS[notice.category] || CATEGORY_COLORS["일반"];
              return (
                <button
                  key={notice.id}
                  type="button"
                  className="notice-grid-row"
                  onClick={() => router.push(`/notices/${notice.id}`)}
                  style={{
                    padding: "14px 20px",
                    alignItems: "center",
                    width: "100%",
                    background: notice.isPinned ? "rgba(201,169,110,0.04)" : "transparent",
                    border: "none",
                    borderBottomWidth: "1px", borderBottomStyle: "solid", borderBottomColor: "#F0EFE9",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "background 0.12s",
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(11,32,64,0.03)"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = notice.isPinned ? "rgba(201,169,110,0.04)" : "transparent"}
                >
                  {/* 분류 */}
                  <span style={{
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                    fontFamily: "'DM Mono', monospace",
                    backgroundColor: catColor.bg, color: catColor.text,
                    border: `1px solid ${catColor.border}`,
                    width: "fit-content",
                  }}>
                    {notice.category}
                  </span>

                  {/* 제목 */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    {notice.isPinned && <Pin size={13} color="#C9A96E" strokeWidth={2} style={{ flexShrink: 0 }} />}
                    <span style={{
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                      fontWeight: notice.isPinned ? 600 : 400,
                      color: "#100F0F",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {notice.title}
                    </span>
                    {(notice.commentCount ?? 0) > 0 && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "2px",
                        fontSize: "11px", color: "#9C9891", fontFamily: "'DM Mono', monospace",
                        flexShrink: 0,
                      }}>
                        <MessageSquare size={11} strokeWidth={2} />
                        {notice.commentCount}
                      </span>
                    )}
                    {notice.attachments && notice.attachments.length > 0 && (
                      <span style={{ fontSize: "11px", color: "#9C9891", flexShrink: 0 }}>
                        📎
                      </span>
                    )}
                  </div>

                  {/* 작성자 */}
                  <span className="notice-col-author" style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#52504B",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {notice.author?.name || "익명"}
                  </span>

                  {/* 날짜 */}
                  <span style={{
                    fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
                  }}>
                    {formatDate(notice.createdAt)}
                  </span>

                  {/* 조회수 */}
                  <span className="notice-col-views" style={{
                    alignItems: "center", gap: "3px",
                    fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
                  }}>
                    <Eye size={11} strokeWidth={2} />
                    {notice.viewCount}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* ── 페이지네이션 ── */}
        {totalPages > 1 && (
          <div style={{
            display: "flex", justifyContent: "center", alignItems: "center",
            gap: "8px", marginTop: "32px",
          }}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #E8E5DF", backgroundColor: "#FFFFFF",
                color: page === 1 ? "#D0CDC7" : "#52504B",
                cursor: page === 1 ? "default" : "pointer",
              }}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev !== undefined && p - prev > 1;
                return (
                  <span key={p} style={{ display: "contents" }}>
                    {showEllipsis && (
                      <span style={{ color: "#9C9891", fontFamily: "'DM Mono', monospace", fontSize: "13px" }}>...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setPage(p)}
                      style={{
                        minWidth: "36px", height: "36px", borderRadius: "8px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        border: p === page ? "1.5px solid #0B2040" : "1px solid #E8E5DF",
                        backgroundColor: p === page ? "#0B2040" : "#FFFFFF",
                        color: p === page ? "#FFFFFF" : "#52504B",
                        fontFamily: "'DM Mono', monospace", fontSize: "13px", fontWeight: 500,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </button>
                  </span>
                );
              })}
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: "36px", height: "36px", borderRadius: "8px",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "1px solid #E8E5DF", backgroundColor: "#FFFFFF",
                color: page === totalPages ? "#D0CDC7" : "#52504B",
                cursor: page === totalPages ? "default" : "pointer",
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
