"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[App Error]", error);
    }, [error]);

    return (
        <main
            className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{ backgroundColor: "#080705" }}
        >
            <p
                style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "rgba(201,169,110,0.4)",
                    fontSize: "clamp(60px, 12vw, 140px)",
                    fontWeight: 900,
                    lineHeight: 1,
                }}
            >
                오류
            </p>
            <h1
                className="mt-6 mb-3 text-center"
                style={{
                    fontFamily: "'Noto Serif KR', serif",
                    color: "#F5F0E8",
                    fontSize: "clamp(18px, 3vw, 28px)",
                    fontWeight: 700,
                }}
            >
                예기치 않은 오류가 발생했습니다
            </h1>
            <p
                className="mb-12 text-center"
                style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    color: "rgba(245,240,232,0.35)",
                    fontSize: "14px",
                    lineHeight: 1.8,
                    maxWidth: "400px",
                }}
            >
                잠시 후 다시 시도해주세요. 문제가 지속되면 페이지를 새로고침해 주세요.
            </p>
            <button
                onClick={reset}
                style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    color: "#C9A96E",
                    fontSize: "14px",
                    borderBottom: "1px solid #C9A96E",
                    paddingBottom: "2px",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid #C9A96E",
                    cursor: "pointer",
                }}
            >
                다시 시도
            </button>
        </main>
    );
}
