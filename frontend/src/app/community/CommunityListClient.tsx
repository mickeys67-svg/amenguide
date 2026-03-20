"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, Pin, MessageSquare, Eye, PenLine, Search,
} from "lucide-react";
import { apiFetch } from "@/utils/api";
import { formatDate } from "@/utils/formatDate";
import { useAuth } from "@/hooks/useAuth";
import type { CommunityPost, CommunityListResponse, GraceLevel } from "@/types/community";
import { COMMUNITY_CATEGORIES, REACTION_TYPES, GRACE_LEVELS } from "@/types/community";
import { Navigation } from "@/components/main/Navigation";

// ── 반응형 스타일 ──────────────────────────────────────────────────────
const RESPONSIVE_STYLE = `
  .community-grid-header, .community-grid-row {
    display: grid;
    grid-template-columns: 80px 1fr 100px 80px 80px 80px;
    align-items: center;
  }
  .community-col-author, .community-col-views, .community-col-reactions { display: block; }
  .grace-bottom-grid { display: grid; grid-template-columns: 1fr 1fr; }
  .grace-bottom-right { border-right: none; }
  .grace-bottom-left { border-right: 1px solid rgba(201,169,110,0.12); }
  @media (max-width: 767px) {
    .community-grid-header { display: none; }
    .community-grid-row {
      grid-template-columns: auto 1fr auto;
      gap: 4px;
    }
    .community-col-author, .community-col-views, .community-col-reactions { display: none; }
    .grace-bottom-grid { grid-template-columns: 1fr; }
    .grace-bottom-left { border-right: none; border-bottom: 1px solid rgba(201,169,110,0.12); }
    .grace-pagination-row { flex-direction: column !important; }
    .grace-card-wrapper { flex: 1 1 100% !important; max-width: 100% !important; }
    .pagination-side { width: 100%; }
  }
`;

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "교리문답": { bg: "rgba(30,90,160,0.08)", text: "#1E5AA0" },
  "신앙나눔": { bg: "rgba(26,107,64,0.08)", text: "#1A6B40" },
  "기도요청": { bg: "rgba(201,169,110,0.12)", text: "#8B6914" },
  "성경공부": { bg: "rgba(128,0,128,0.08)", text: "#800080" },
  "전례생활": { bg: "rgba(200,58,30,0.08)", text: "#C83A1E" },
  "자유게시판": { bg: "rgba(11,32,64,0.06)", text: "#0B2040" },
};

export default function CommunityListClient() {
  const router = useRouter();
  const [data, setData] = useState<CommunityPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const { authUser } = useAuth();
  const [graceLevel, setGraceLevel] = useState<GraceLevel | null>(null);
  const [graceInfoOpen, setGraceInfoOpen] = useState(false);

  useEffect(() => {
    if (!authUser) return;
    apiFetch<GraceLevel>(`/community/grace/${authUser.id}`)
      .then(setGraceLevel)
      .catch(() => {});
  }, [authUser]);

  const fetchPosts = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (category !== "전체") params.set("category", category);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      const res = await apiFetch<CommunityListResponse>(`/community?${params}`, { signal });
      setData(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
      setCategoryCounts(res.categoryCounts);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error("Failed to fetch community posts:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [page, category, searchQuery]);

  useEffect(() => {
    const controller = new AbortController();
    fetchPosts(controller.signal);
    return () => controller.abort();
  }, [fetchPosts]);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  const totalAll = Object.values(categoryCounts).reduce((a, b) => a + b, 0);

  return (
    <>
      <Navigation />
      <div style={{ minHeight: "100vh", backgroundColor: "#F8F7F4", paddingTop: "72px" }}>
        <style>{RESPONSIVE_STYLE}</style>
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
          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <h1 style={{
                    fontFamily: "'Noto Serif KR', serif", fontSize: "clamp(24px, 4vw, 32px)",
                    fontWeight: 900, color: "#0B2040", margin: 0, lineHeight: 1.3,
                  }}>
                    Cenaculum
                  </h1>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                    color: "#9C9891", fontWeight: 400,
                  }}>
                    친교의 다락방
                  </span>
                </div>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  color: "#9C9891", margin: 0,
                }}>
                  전체 {totalAll}건의 나눔
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                {/* 은총 등급 뱃지 */}
                {authUser && graceLevel && (
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: "8px",
                      padding: "8px 16px", borderRadius: "10px",
                      backgroundColor: graceLevel.level >= 3 ? "rgba(201,169,110,0.1)" : "rgba(11,32,64,0.04)",
                      border: `1px solid ${graceLevel.level >= 3 ? "rgba(201,169,110,0.25)" : "#E8E5DF"}`,
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{graceLevel.icon}</span>
                    <div style={{ lineHeight: 1.3 }}>
                      <div style={{
                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                        fontWeight: 600, color: "#0B2040",
                      }}>
                        {graceLevel.title}
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: "11px",
                          color: "#9C9891", marginLeft: "6px",
                        }}>
                          Lv.{graceLevel.level}
                        </span>
                      </div>
                      <div style={{
                        fontFamily: "'DM Mono', monospace", fontSize: "11px",
                        color: "#9C9891",
                      }}>
                        {graceLevel.gracePoints}pt · 글 {graceLevel.postCount} · 댓글 {graceLevel.commentCount}
                      </div>
                    </div>
                  </div>
                )}
                {authUser && (
                  <button
                    type="button"
                    onClick={() => router.push("/community/write")}
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
            </div>

            {/* 검색 */}
            <div style={{
              display: "flex", gap: "8px", marginTop: "20px",
              maxWidth: "400px",
            }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="제목 또는 내용 검색..."
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: "8px",
                  border: "1px solid #E8E5DF", backgroundColor: "#FFFFFF",
                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                  color: "#100F0F", outline: "none",
                }}
              />
              <button
                type="button"
                onClick={handleSearch}
                style={{
                  width: "40px", height: "40px", borderRadius: "8px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: "1px solid #E8E5DF", backgroundColor: "#FFFFFF",
                  color: "#52504B", cursor: "pointer",
                }}
              >
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* ── 카테고리 필터 (아이콘 + 개수) ── */}
          <div style={{
            display: "flex", gap: "8px", marginBottom: "24px",
            flexWrap: "wrap", overflowX: "auto",
          }}>
            {COMMUNITY_CATEGORIES.map((cat) => {
              const count = cat.id === "전체" ? totalAll : (categoryCounts[cat.id] || 0);
              const isActive = category === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategory(cat.id); setPage(1); }}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "7px 14px", borderRadius: "20px",
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", fontWeight: 500,
                    backgroundColor: isActive ? "#0B2040" : "rgba(11,32,64,0.05)",
                    color: isActive ? "#FFFFFF" : "#52504B",
                    border: "none", cursor: "pointer",
                    transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span style={{
                    fontSize: "11px", fontFamily: "'DM Mono', monospace",
                    opacity: 0.7,
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── 게시글 목록 ── */}
          <div style={{
            backgroundColor: "#FFFFFF", borderRadius: "12px",
            border: "1px solid #E8E5DF", overflow: "hidden",
          }}>
            {/* 테이블 헤더 */}
            <div className="community-grid-header" style={{
              padding: "12px 20px",
              borderBottom: "1px solid #E8E5DF",
              backgroundColor: "#FAFAF8",
            }}>
              {["분류", "제목", "작성자", "날짜", "조회", "반응"].map((h, i) => (
                <span
                  key={h}
                  className={i === 2 ? "community-col-author" : i === 4 ? "community-col-views" : i === 5 ? "community-col-reactions" : undefined}
                  style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                    fontWeight: 600, color: "#9C9891",
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            {loading ? (
              <div style={{ padding: "60px", textAlign: "center", color: "#9C9891", fontFamily: "'Noto Sans KR', sans-serif" }}>
                불러오는 중...
              </div>
            ) : data.length === 0 ? (
              <div style={{ padding: "60px", textAlign: "center", fontFamily: "'Noto Sans KR', sans-serif" }}>
                <p style={{ color: "#9C9891", fontSize: "15px", marginBottom: "8px" }}>
                  {searchQuery ? `"${searchQuery}" 검색 결과가 없습니다.` : "아직 게시글이 없습니다."}
                </p>
                {authUser && !searchQuery && (
                  <button
                    type="button"
                    onClick={() => router.push("/community/write")}
                    style={{
                      padding: "8px 20px", borderRadius: "8px",
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px", fontWeight: 500,
                      backgroundColor: "#0B2040", color: "#FFFFFF",
                      border: "none", cursor: "pointer",
                    }}
                  >
                    첫 번째 글 쓰기
                  </button>
                )}
              </div>
            ) : (
              data.map((post) => {
                const catColor = CATEGORY_COLORS[post.category] || CATEGORY_COLORS["자유게시판"];
                return (
                  <button
                    key={post.id}
                    type="button"
                    className="community-grid-row"
                    onClick={() => router.push(`/community/${post.id}`)}
                    style={{
                      padding: "14px 20px",
                      width: "100%",
                      background: post.isPinned ? "rgba(201,169,110,0.04)" : "transparent",
                      border: "none",
                      borderBottom: "1px solid #F0EFE9",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 0.12s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(11,32,64,0.03)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.backgroundColor = post.isPinned ? "rgba(201,169,110,0.04)" : "transparent"}
                  >
                    {/* 분류 */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      padding: "3px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: 600,
                      fontFamily: "'Noto Sans KR', sans-serif",
                      backgroundColor: catColor.bg, color: catColor.text,
                      width: "fit-content", whiteSpace: "nowrap",
                    }}>
                      {(() => { const cat = COMMUNITY_CATEGORIES.find(c => c.id === post.category); return `${cat?.icon || "💬"} ${cat?.label || post.category}`; })()}
                    </span>

                    {/* 제목 */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                      {post.isPinned && <Pin size={13} color="#C9A96E" strokeWidth={2} style={{ flexShrink: 0 }} />}
                      <span style={{
                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "14px",
                        fontWeight: post.isPinned ? 600 : 400,
                        color: "#100F0F",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {post.title}
                      </span>
                      {(post.commentCount ?? 0) > 0 && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: "2px",
                          fontSize: "11px", color: "#C9A96E", fontFamily: "'DM Mono', monospace",
                          flexShrink: 0,
                        }}>
                          <MessageSquare size={11} strokeWidth={2} />
                          {post.commentCount}
                        </span>
                      )}
                      {post.isClosed && (
                        <span style={{ fontSize: "11px", color: "#9C9891" }}>🔒</span>
                      )}
                    </div>

                    {/* 작성자 */}
                    <span className="community-col-author" style={{
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px", color: "#52504B",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {post.author?.name || "익명"}
                    </span>

                    {/* 날짜 */}
                    <span style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
                    }}>
                      {formatDate(post.createdAt)}
                    </span>

                    {/* 조회수 */}
                    <span className="community-col-views" style={{
                      display: "flex", alignItems: "center", gap: "3px",
                      fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
                    }}>
                      <Eye size={11} strokeWidth={2} />
                      {post.viewCount}
                    </span>

                    {/* 리액션 수 */}
                    <span className="community-col-reactions" style={{
                      fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#C9A96E",
                    }}>
                      {(post.reactionCount ?? 0) > 0 ? `🙏 ${post.reactionCount}` : ""}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {/* ── 하단: 은총등급(55%) + 페이지네이션(45%) 나란히 ── */}
          <div className="grace-pagination-row" style={{
            display: "flex", gap: "20px", marginTop: "40px", alignItems: "flex-start",
          }}>

          {/* ── 은총 등급 안내 (프리미엄 디자인) ── */}
          <div className="grace-card-wrapper" style={{ flex: "0 0 45%", maxWidth: "45%" }}>
            <button
              type="button"
              onClick={() => setGraceInfoOpen(!graceInfoOpen)}
              style={{
                display: "flex", alignItems: "center", gap: "10px", width: "100%",
                padding: "18px 24px",
                borderRadius: graceInfoOpen ? "16px 16px 0 0" : "16px",
                background: "linear-gradient(135deg, #0B2040 0%, #183568 50%, #1E5AA0 100%)",
                border: "none",
                cursor: "pointer", transition: "all 0.2s",
                boxShadow: "0 4px 20px rgba(11,32,64,0.15)",
              }}
            >
              <span style={{ fontSize: "18px" }}>✨</span>
              <span style={{
                fontFamily: "'DM Serif Display', serif", fontSize: "17px",
                fontWeight: 400, color: "#FFFFFF", flex: 1, textAlign: "left",
                letterSpacing: "0.5px",
              }}>
                Gratia — 은총 등급
              </span>
              {graceLevel && (
                <span style={{
                  padding: "4px 12px", borderRadius: "20px",
                  backgroundColor: "rgba(201,169,110,0.25)",
                  fontFamily: "'DM Mono', monospace", fontSize: "11px",
                  color: "#C9A96E", fontWeight: 600,
                }}>
                  {graceLevel.icon} Lv.{graceLevel.level}
                </span>
              )}
              <span style={{
                fontSize: "12px", color: "rgba(255,255,255,0.5)",
                transform: graceInfoOpen ? "rotate(180deg)" : "rotate(0deg)",
                transition: "transform 0.25s ease",
              }}>
                ▼
              </span>
            </button>

            {graceInfoOpen && (
              <div style={{
                borderRadius: "0 0 16px 16px",
                border: "1px solid rgba(201,169,110,0.2)", borderTop: "none",
                overflow: "hidden",
              }}>
                {/* ── 내 현재 등급 프로그레스 (로그인 시) ── */}
                {graceLevel && (
                  <div style={{
                    padding: "24px 24px 20px",
                    background: "linear-gradient(180deg, rgba(11,32,64,0.04) 0%, #FFFFFF 100%)",
                    borderBottom: "1px solid rgba(201,169,110,0.12)",
                  }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px",
                    }}>
                      <div style={{
                        width: "52px", height: "52px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #C9A96E 0%, #E8D5A8 100%)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "26px",
                        boxShadow: "0 3px 12px rgba(201,169,110,0.3)",
                      }}>
                        {graceLevel.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontFamily: "'Noto Serif KR', serif", fontSize: "18px",
                          fontWeight: 700, color: "#0B2040", marginBottom: "2px",
                        }}>
                          {graceLevel.title}
                        </div>
                        <div style={{
                          fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#9C9891",
                        }}>
                          {graceLevel.gracePoints}pt · 글 {graceLevel.postCount} · 댓글 {graceLevel.commentCount} · 리액션 {graceLevel.reactionsReceived}
                        </div>
                      </div>
                      <div style={{
                        padding: "6px 14px", borderRadius: "20px",
                        backgroundColor: graceLevel.level >= 3 ? "rgba(26,107,64,0.08)" : "rgba(201,169,110,0.1)",
                        fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                        fontWeight: 600,
                        color: graceLevel.level >= 3 ? "#1A6B40" : "#8B6914",
                      }}>
                        {graceLevel.level >= 3 ? "자동 승인" : "관리자 컨펌"}
                      </div>
                    </div>
                    {/* 프로그레스 바 */}
                    {graceLevel.level < 5 && (() => {
                      const nextLevel = GRACE_LEVELS[graceLevel.level]; // 다음 레벨
                      const currentMin = GRACE_LEVELS[graceLevel.level - 1].minPoints;
                      const nextMin = nextLevel.minPoints;
                      const progress = Math.min(100, ((graceLevel.gracePoints - currentMin) / (nextMin - currentMin)) * 100);
                      return (
                        <div>
                          <div style={{
                            display: "flex", justifyContent: "space-between", marginBottom: "6px",
                          }}>
                            <span style={{
                              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "11px", color: "#9C9891",
                            }}>
                              다음 등급: {nextLevel.icon} {nextLevel.title}
                            </span>
                            <span style={{
                              fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#C9A96E",
                            }}>
                              {graceLevel.gracePoints}/{nextMin}pt
                            </span>
                          </div>
                          <div style={{
                            height: "6px", borderRadius: "3px",
                            backgroundColor: "rgba(11,32,64,0.06)",
                            overflow: "hidden",
                          }}>
                            <div style={{
                              height: "100%", borderRadius: "3px",
                              width: `${progress}%`,
                              background: "linear-gradient(90deg, #C9A96E 0%, #E8D5A8 100%)",
                              transition: "width 0.6s ease",
                            }} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* ── 5단계 등급 로드맵 ── */}
                <div style={{
                  padding: "24px",
                  backgroundColor: "#FFFFFF",
                }}>
                  <div style={{
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                    fontWeight: 600, color: "#9C9891", marginBottom: "16px",
                    textTransform: "uppercase", letterSpacing: "1.5px",
                  }}>
                    신앙 여정의 다섯 단계
                  </div>

                  {/* 등급 스텝 */}
                  <div style={{ position: "relative" }}>
                    {/* 연결선 */}
                    <div style={{
                      position: "absolute", left: "24px", top: "28px",
                      width: "2px", height: "calc(100% - 56px)",
                      background: "linear-gradient(180deg, #E8D5A8 0%, rgba(201,169,110,0.2) 100%)",
                    }} />

                    {GRACE_LEVELS.map((gl, idx) => {
                      const isMyLevel = graceLevel?.level === gl.level;
                      const isPast = graceLevel ? graceLevel.level > gl.level : false;
                      const isFuture = graceLevel ? graceLevel.level < gl.level : true;
                      const descriptions = [
                        "세례의 은총으로 신앙의 첫걸음을 내딛습니다",
                        "묵주기도와 함께 신앙이 깊어지는 단계입니다",
                        "말씀 안에서 하느님의 뜻을 분별합니다",
                        "자신을 봉헌하여 공동체에 헌신합니다",
                        "복음을 전하는 사도적 소명을 실천합니다",
                      ];
                      return (
                        <div
                          key={gl.level}
                          style={{
                            display: "flex", alignItems: "flex-start", gap: "16px",
                            padding: "12px 0",
                            position: "relative",
                          }}
                        >
                          {/* 아이콘 원 */}
                          <div style={{
                            width: "48px", height: "48px", borderRadius: "50%",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "22px", flexShrink: 0, position: "relative", zIndex: 1,
                            background: isMyLevel
                              ? "linear-gradient(135deg, #C9A96E 0%, #E8D5A8 100%)"
                              : isPast
                                ? "rgba(201,169,110,0.15)"
                                : "#F5F4F0",
                            border: isMyLevel
                              ? "2px solid #C9A96E"
                              : isPast
                                ? "2px solid rgba(201,169,110,0.3)"
                                : "2px solid #E8E5DF",
                            boxShadow: isMyLevel ? "0 3px 12px rgba(201,169,110,0.35)" : "none",
                          }}>
                            {gl.icon}
                          </div>

                          {/* 정보 */}
                          <div style={{ flex: 1, paddingTop: "2px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                              <span style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: isMyLevel ? "16px" : "14px",
                                fontWeight: isMyLevel ? 700 : 600,
                                color: isFuture ? "#9C9891" : "#0B2040",
                              }}>
                                {gl.title}
                              </span>
                              <span style={{
                                fontFamily: "'DM Mono', monospace", fontSize: "11px",
                                padding: "1px 8px", borderRadius: "10px",
                                backgroundColor: isMyLevel ? "rgba(201,169,110,0.12)" : "rgba(11,32,64,0.04)",
                                color: isMyLevel ? "#C9A96E" : "#9C9891",
                                fontWeight: 600,
                              }}>
                                Lv.{gl.level}
                              </span>
                              {isMyLevel && (
                                <span style={{
                                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "10px",
                                  padding: "2px 8px", borderRadius: "10px",
                                  background: "linear-gradient(135deg, #C9A96E 0%, #E8D5A8 100%)",
                                  color: "#FFFFFF", fontWeight: 700,
                                }}>
                                  현재
                                </span>
                              )}
                              {gl.level >= 3 && (
                                <span style={{
                                  fontFamily: "'Noto Sans KR', sans-serif", fontSize: "10px",
                                  padding: "2px 8px", borderRadius: "10px",
                                  backgroundColor: "rgba(26,107,64,0.08)",
                                  color: "#1A6B40", fontWeight: 600,
                                }}>
                                  자동 승인
                                </span>
                              )}
                            </div>
                            <div style={{
                              fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                              color: isFuture ? "#C0BDB7" : "#52504B",
                              lineHeight: 1.5, marginBottom: "2px",
                            }}>
                              {descriptions[idx]}
                            </div>
                            <div style={{
                              fontFamily: "'DM Mono', monospace", fontSize: "11px",
                              color: "#9C9891",
                            }}>
                              {gl.minPoints}pt 이상
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ── 하단: 포인트 + 정책 ── */}
                <div
                  className="grace-bottom-grid"
                  style={{
                    borderTop: "1px solid rgba(201,169,110,0.12)",
                  }}
                >
                  {/* 포인트 획득 */}
                  <div className="grace-bottom-left" style={{
                    padding: "20px 24px",
                    backgroundColor: "#FAFAF8",
                  }}>
                    <div style={{
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                      fontWeight: 600, color: "#9C9891", marginBottom: "14px",
                      textTransform: "uppercase", letterSpacing: "1px",
                    }}>
                      은총 포인트
                    </div>
                    {[
                      { label: "게시글 작성", point: "+10", color: "#0B2040" },
                      { label: "댓글 작성", point: "+3", color: "#1E5AA0" },
                      { label: "받은 리액션", point: "+2", color: "#C9A96E" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        style={{
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                          padding: "8px 0",
                          borderBottom: "1px solid rgba(232,229,223,0.5)",
                        }}
                      >
                        <span style={{
                          fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                          color: "#52504B",
                        }}>
                          {item.label}
                        </span>
                        <span style={{
                          fontFamily: "'DM Mono', monospace", fontSize: "14px",
                          fontWeight: 700, color: item.color,
                        }}>
                          {item.point}pt
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 승인 정책 */}
                  <div style={{
                    padding: "20px 24px",
                    backgroundColor: "#FAFAF8",
                  }}>
                    <div style={{
                      fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                      fontWeight: 600, color: "#9C9891", marginBottom: "14px",
                      textTransform: "uppercase", letterSpacing: "1px",
                    }}>
                      게시 정책
                    </div>
                    {[
                      { icon: "🤖", text: "모든 글 AI 자동 검토" },
                      { icon: "🛡️", text: "Lv.1~2 관리자 승인 필요" },
                      { icon: "✅", text: "Lv.3+ 자동 게시" },
                      { icon: "⛔", text: "이단·광고·비속어 즉시 차단" },
                    ].map((item) => (
                      <div
                        key={item.text}
                        style={{
                          display: "flex", alignItems: "center", gap: "8px",
                          padding: "7px 0",
                          borderBottom: "1px solid rgba(232,229,223,0.5)",
                        }}
                      >
                        <span style={{ fontSize: "13px", flexShrink: 0 }}>{item.icon}</span>
                        <span style={{
                          fontFamily: "'Noto Sans KR', sans-serif", fontSize: "13px",
                          color: "#52504B",
                        }}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── 페이지네이션 (칩 스타일, 오른쪽) ── */}
          {totalPages > 1 && (
            <div className="pagination-side" style={{
              flex: 1,
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "8px", paddingTop: "8px",
            }}>
              <div style={{
                fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px",
                fontWeight: 600, color: "#9C9891", marginBottom: "8px",
                textTransform: "uppercase", letterSpacing: "1px",
              }}>
                페이지
              </div>
              <div style={{
                display: "flex", flexWrap: "wrap", justifyContent: "center",
                gap: "6px",
              }}>
                {/* 이전 */}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "7px 12px", borderRadius: "20px",
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", fontWeight: 500,
                    backgroundColor: page === 1 ? "rgba(11,32,64,0.03)" : "rgba(11,32,64,0.05)",
                    color: page === 1 ? "#D0CDC7" : "#52504B",
                    border: "none",
                    cursor: page === 1 ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  <ChevronLeft size={13} /> 이전
                </button>

                {/* 페이지 번호 */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev !== undefined && p - prev > 1;
                    const isActive = p === page;
                    return (
                      <span key={p} style={{ display: "contents" }}>
                        {showEllipsis && (
                          <span style={{ color: "#9C9891", fontFamily: "'DM Mono', monospace", fontSize: "12px" }}>···</span>
                        )}
                        <button
                          type="button"
                          onClick={() => setPage(p)}
                          style={{
                            padding: "7px 12px", borderRadius: "20px",
                            fontFamily: "'DM Mono', monospace", fontSize: "12px", fontWeight: 500,
                            backgroundColor: isActive ? "#0B2040" : "rgba(11,32,64,0.05)",
                            color: isActive ? "#FFFFFF" : "#52504B",
                            border: "none",
                            cursor: "pointer",
                            transition: "all 0.15s",
                            minWidth: "34px",
                          }}
                        >
                          {p}
                        </button>
                      </span>
                    );
                  })}

                {/* 다음 */}
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: "flex", alignItems: "center", gap: "4px",
                    padding: "7px 12px", borderRadius: "20px",
                    fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", fontWeight: 500,
                    backgroundColor: page === totalPages ? "rgba(11,32,64,0.03)" : "rgba(11,32,64,0.05)",
                    color: page === totalPages ? "#D0CDC7" : "#52504B",
                    border: "none",
                    cursor: page === totalPages ? "default" : "pointer",
                    transition: "all 0.15s",
                  }}
                >
                  다음 <ChevronRight size={13} />
                </button>
              </div>

              {/* 페이지 정보 */}
              <div style={{
                fontFamily: "'DM Mono', monospace", fontSize: "11px",
                color: "#9C9891", marginTop: "4px",
              }}>
                {page} / {totalPages} · 총 {total}건
              </div>
            </div>
          )}

          </div>{/* grace-pagination-row 닫기 */}

        </div>
      </div>
    </>
  );
}
