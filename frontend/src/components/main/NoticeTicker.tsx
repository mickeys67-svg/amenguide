"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../../utils/api";
import type { Notice, NoticeListResponse } from "../../types/notice";

export function NoticeTicker() {
    const router = useRouter();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [current, setCurrent] = useState(0);
    const [sliding, setSliding] = useState(false);
    const pausedRef = useRef(false);

    useEffect(() => {
        apiFetch<NoticeListResponse>("/notices?page=1&limit=5")
            .then(res => {
                const approved = res.data.filter(n => n.status === "APPROVED");
                setNotices(approved);
            })
            .catch(() => {});
    }, []);

    const next = useCallback(() => {
        if (notices.length <= 1 || pausedRef.current) return;
        setSliding(true);
        setTimeout(() => {
            setCurrent(i => (i + 1) % notices.length);
            setSliding(false);
        }, 300);
    }, [notices.length]);

    useEffect(() => {
        if (notices.length <= 1) return;
        const id = setInterval(next, 4000);
        return () => clearInterval(id);
    }, [notices.length, next]);

    if (!notices.length) return null;

    const n = notices[current];
    const catColor = n.category === "긴급" ? "#C0392B" : n.category === "공지" ? "#1B7A4A" : "#1B4080";
    const catBg = n.category === "긴급" ? "rgba(192,57,43,0.08)" : n.category === "공지" ? "rgba(27,122,74,0.08)" : "rgba(27,64,128,0.08)";
    const date = new Date(n.createdAt);
    const dateStr = `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;

    return (
        <>
            <style>{`
                .notice-ticker {
                    background: linear-gradient(135deg, #FDFCFA 0%, #F5F0E8 100%);
                    border-bottom: 1px solid #E8E5DF;
                    position: relative;
                    overflow: hidden;
                }
                .notice-ticker::before {
                    content: "";
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 1px;
                    background: linear-gradient(90deg, transparent, #C9A96E 30%, #C9A96E 70%, transparent);
                    opacity: 0.4;
                }
                .ticker-inner {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    height: 48px;
                    gap: 14px;
                }
                .ticker-icon {
                    flex-shrink: 0;
                    width: 28px; height: 28px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #C9A96E, #B8934E);
                    border-radius: 6px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                }
                .ticker-badge {
                    flex-shrink: 0;
                    font-size: 11px;
                    font-weight: 700;
                    padding: 2px 8px;
                    border-radius: 4px;
                    letter-spacing: 0.3px;
                }
                .ticker-content {
                    flex: 1;
                    min-width: 0;
                    overflow: hidden;
                    position: relative;
                    height: 24px;
                }
                .ticker-slide {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 24px;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    cursor: pointer;
                }
                .ticker-slide:hover .ticker-title {
                    color: #1B4080;
                }
                .ticker-slide.out {
                    transform: translateY(-100%);
                    opacity: 0;
                }
                .ticker-title {
                    font-size: 14px;
                    font-weight: 500;
                    color: #2C2C2C;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    transition: color 0.15s;
                    font-family: "Noto Sans KR", sans-serif;
                }
                .ticker-date {
                    flex-shrink: 0;
                    font-size: 12px;
                    color: #999;
                    font-family: "Noto Sans KR", sans-serif;
                }
                .ticker-more {
                    flex-shrink: 0;
                    font-size: 12px;
                    font-weight: 600;
                    color: #C9A96E;
                    text-decoration: none;
                    cursor: pointer;
                    padding: 4px 0;
                    transition: color 0.15s;
                    white-space: nowrap;
                    font-family: "Noto Sans KR", sans-serif;
                }
                .ticker-more:hover {
                    color: #1B4080;
                }
                .ticker-dots {
                    flex-shrink: 0;
                    display: flex;
                    gap: 4px;
                    align-items: center;
                }
                .ticker-dot {
                    width: 5px; height: 5px;
                    border-radius: 50%;
                    background: #D5D0C8;
                    transition: all 0.3s;
                }
                .ticker-dot.active {
                    background: #C9A96E;
                    width: 14px;
                    border-radius: 3px;
                }
                @media (max-width: 600px) {
                    .ticker-inner { padding: 0 16px; gap: 10px; height: 44px; }
                    .ticker-title { font-size: 13px; }
                    .ticker-more { display: none; }
                    .ticker-dots { display: none; }
                }
            `}</style>
            <div className="notice-ticker"
                onMouseEnter={() => { pausedRef.current = true; }}
                onMouseLeave={() => { pausedRef.current = false; }}
            >
                <div className="ticker-inner">
                    <div className="ticker-icon">N</div>
                    <div className="ticker-content">
                        <div
                            className={`ticker-slide ${sliding ? "out" : ""}`}
                            onClick={() => router.push(`/notices/${n.id}`)}
                        >
                            <span className="ticker-badge" style={{ color: catColor, background: catBg }}>
                                {n.category}
                            </span>
                            <span className="ticker-title">{n.title}</span>
                            <span className="ticker-date">{dateStr}</span>
                        </div>
                    </div>
                    {notices.length > 1 && (
                        <div className="ticker-dots">
                            {notices.map((_, i) => (
                                <div key={i} className={`ticker-dot ${i === current ? "active" : ""}`} />
                            ))}
                        </div>
                    )}
                    <span className="ticker-more" onClick={() => router.push("/notices")}>
                        전체보기
                    </span>
                </div>
            </div>
        </>
    );
}
