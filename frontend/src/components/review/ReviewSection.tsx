"use client";

import { useState, useEffect, useCallback } from "react";
import { StarRating } from "./StarRating";

interface Review {
    id: string;
    userId: string;
    eventId: string;
    rating: number;
    content?: string | null;
    createdAt: string;
    user: { name: string | null };
}

interface ReviewData {
    reviews: Review[];
    averageRating: number;
    totalCount: number;
}

interface ReviewSectionProps {
    eventId: string;
}

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "https://amenguide-backend-775250805671.us-west1.run.app";

export function ReviewSection({ eventId }: ReviewSectionProps) {
    const [data, setData] = useState<ReviewData | null>(null);
    const [loading, setLoading] = useState(true);

    // 로그인 상태
    const [authUserId, setAuthUserId] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

    // 작성 폼
    const [newRating, setNewRating] = useState(0);
    const [newContent, setNewContent] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // 수정 모드
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        try {
            const user = localStorage.getItem("authUser");
            const token = localStorage.getItem("authToken");
            if (user && token) {
                setAuthUserId(JSON.parse(user).id);
                setAuthToken(token);
            }
        } catch {}
    }, []);

    const fetchReviews = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/reviews?eventId=${eventId}`);
            if (res.ok) {
                setData(await res.json());
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleSubmit = async () => {
        if (!authToken || newRating === 0) return;
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/reviews`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    eventId,
                    rating: newRating,
                    content: newContent.trim() || undefined,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "후기 등록에 실패했습니다.");
            }
            setNewRating(0);
            setNewContent("");
            await fetchReviews();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdate = async (reviewId: string) => {
        if (!authToken || editRating === 0) return;
        try {
            const res = await fetch(`${API_BASE}/reviews/${reviewId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    rating: editRating,
                    content: editContent.trim() || undefined,
                }),
            });
            if (res.ok) {
                setEditingId(null);
                await fetchReviews();
            }
        } catch {}
    };

    const handleDelete = async (reviewId: string) => {
        if (!authToken) return;
        try {
            await fetch(`${API_BASE}/reviews/${reviewId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${authToken}` },
            });
            await fetchReviews();
        } catch {}
    };

    const hasMyReview = data?.reviews.some((r) => r.userId === authUserId);

    if (loading) return null;

    return (
        <section style={{ marginTop: "48px" }}>
            {/* 헤더: 제목 + 평균 별점 */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "24px",
                paddingBottom: "16px",
                borderBottom: "1px solid #E8E5DF",
            }}>
                <h3 style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#100F0F",
                }}>
                    참가 후기
                </h3>
                {data && data.totalCount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <StarRating value={Math.round(data.averageRating)} readOnly size={16} />
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "14px",
                            color: "#C9A96E",
                            fontWeight: 600,
                        }}>
                            {data.averageRating}
                        </span>
                        <span style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: "12px",
                            color: "#9C9891",
                        }}>
                            ({data.totalCount}개)
                        </span>
                    </div>
                )}
            </div>

            {/* 리뷰 작성 폼 */}
            {authToken && !hasMyReview && (
                <div style={{
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E5DF",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "24px",
                }}>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#100F0F",
                        marginBottom: "12px",
                    }}>
                        후기 작성
                    </p>
                    <div style={{ marginBottom: "12px" }}>
                        <StarRating value={newRating} onChange={setNewRating} size={24} />
                    </div>
                    <textarea
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        placeholder="행사에 대한 후기를 남겨주세요 (선택사항)"
                        rows={3}
                        style={{
                            width: "100%",
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: "13px",
                            color: "#100F0F",
                            border: "1px solid #E8E5DF",
                            borderRadius: "8px",
                            padding: "10px 12px",
                            outline: "none",
                            resize: "vertical",
                            backgroundColor: "#F8F7F4",
                            marginBottom: "12px",
                        }}
                    />
                    {error && (
                        <p style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: "12px",
                            color: "#C83A1E",
                            marginBottom: "8px",
                        }}>
                            {error}
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting || newRating === 0}
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#FFFFFF",
                            backgroundColor: newRating === 0 ? "#D0CDC7" : "#0B2040",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 20px",
                            cursor: newRating === 0 ? "not-allowed" : "pointer",
                            opacity: submitting ? 0.6 : 1,
                            transition: "all 0.15s ease",
                        }}
                    >
                        {submitting ? "등록 중..." : "후기 등록"}
                    </button>
                </div>
            )}

            {/* 미로그인 안내 */}
            {!authToken && (
                <div style={{
                    textAlign: "center",
                    padding: "20px",
                    backgroundColor: "#F8F7F4",
                    borderRadius: "12px",
                    marginBottom: "24px",
                }}>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "13px",
                        color: "#9C9891",
                    }}>
                        로그인 후 후기를 작성할 수 있습니다
                    </p>
                </div>
            )}

            {/* 리뷰 목록 */}
            {data?.reviews.length === 0 && (
                <p style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "13px",
                    color: "#9C9891",
                    textAlign: "center",
                    padding: "32px 0",
                }}>
                    아직 후기가 없습니다. 첫 번째 후기를 남겨보세요!
                </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {data?.reviews.map((review) => (
                    <div
                        key={review.id}
                        style={{
                            backgroundColor: "#FFFFFF",
                            border: "1px solid #E8E5DF",
                            borderRadius: "10px",
                            padding: "16px 20px",
                        }}
                    >
                        {editingId === review.id ? (
                            /* 수정 모드 */
                            <div>
                                <StarRating value={editRating} onChange={setEditRating} size={20} />
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={2}
                                    style={{
                                        width: "100%",
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        border: "1px solid #E8E5DF",
                                        borderRadius: "6px",
                                        padding: "8px",
                                        outline: "none",
                                        marginTop: "8px",
                                        resize: "vertical",
                                    }}
                                />
                                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                                    <button
                                        type="button"
                                        onClick={() => handleUpdate(review.id)}
                                        style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "12px",
                                            fontWeight: 600,
                                            color: "#FFFFFF",
                                            backgroundColor: "#0B2040",
                                            border: "none",
                                            borderRadius: "6px",
                                            padding: "5px 14px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        저장
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditingId(null)}
                                        style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "12px",
                                            color: "#52504B",
                                            backgroundColor: "transparent",
                                            border: "1px solid #E8E5DF",
                                            borderRadius: "6px",
                                            padding: "5px 14px",
                                            cursor: "pointer",
                                        }}
                                    >
                                        취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* 읽기 모드 */
                            <>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                        <span style={{
                                            fontFamily: "'Noto Sans KR', sans-serif",
                                            fontSize: "13px",
                                            fontWeight: 600,
                                            color: "#100F0F",
                                        }}>
                                            {review.user?.name || "익명"}
                                        </span>
                                        <StarRating value={review.rating} readOnly size={14} />
                                    </div>
                                    <span style={{
                                        fontFamily: "'DM Mono', monospace",
                                        fontSize: "11px",
                                        color: "#9C9891",
                                    }}>
                                        {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                                    </span>
                                </div>
                                {review.content && (
                                    <p style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        color: "#52504B",
                                        lineHeight: 1.7,
                                        marginBottom: "8px",
                                    }}>
                                        {review.content}
                                    </p>
                                )}
                                {/* 본인 리뷰: 수정/삭제 버튼 */}
                                {review.userId === authUserId && (
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingId(review.id);
                                                setEditRating(review.rating);
                                                setEditContent(review.content || "");
                                            }}
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "11px",
                                                color: "#52504B",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                padding: 0,
                                            }}
                                        >
                                            수정
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDelete(review.id)}
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                fontSize: "11px",
                                                color: "#C83A1E",
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                textDecoration: "underline",
                                                padding: 0,
                                            }}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
