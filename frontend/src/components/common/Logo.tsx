"use client";

import { useRouter } from "next/navigation";

interface LogoProps {
    /** "dark" = navy mark on light bg (nav, register-event)
     *  "light" = white mark on dark bg (auth panels, admin sidebar) */
    variant?: "dark" | "light";
    /** height of the logo mark in px — text scales proportionally */
    size?: number;
    /** show "가톨릭 행사 허브" subtitle (default true) */
    showSubtitle?: boolean;
    /** custom click handler — default: router.push("/") */
    onClick?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

/**
 * Shared CATHOLICA logo: cross ✝ + map-pin 📍 merged mark + wordmark
 *
 * SVG viewBox 44 × 64 px:
 *  - 3-arm cross at top (top arm + left/right horizontal arms)
 *  - vertical connector bar drops down into circular pin body
 *  - gold circle centered inside pin
 *  - downward triangle forms the pin point
 */
export function Logo({
    variant = "dark",
    size = 28,
    showSubtitle = true,
    onClick,
    style,
    className,
}: LogoProps) {
    const router = useRouter();

    const col  = variant === "dark" ? "#0B2040" : "#FFFFFF";
    const txt  = variant === "dark" ? "#0B2040" : "#FFFFFF";
    const sub  = variant === "dark" ? "#9C9891" : "rgba(255,255,255,0.48)";
    const gold = "#C9A96E";

    // maintain aspect ratio of SVG viewBox (44 w × 64 h)
    const markH = size;
    const markW = Math.round(size * (44 / 64));

    const fontSize     = Math.round(size * (15.5 / 28));   // "CATHOLICA" text
    const subFontSize  = Math.max(8, Math.round(size * (9 / 28))); // subtitle

    const handleClick = () => {
        if (onClick) onClick();
        else router.push("/");
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={className}
            style={{
                display: "flex",
                alignItems: "center",
                gap: Math.round(size * (10 / 28)) + "px",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 0,
                ...style,
            }}
            aria-label="Catholica — 홈으로"
        >
            {/* ── SVG 마크: 십자가 + 위치핀 ─────────────── */}
            <svg
                width={markW}
                height={markH}
                viewBox="0 0 44 64"
                fill="none"
                aria-hidden="true"
            >
                {/* 십자가 — 상단 수직 암 */}
                <rect x="18" y="0"  width="8" height="11" rx="2.5" fill={col} />

                {/* 십자가 — 좌측 수평 암 */}
                <rect x="0"  y="9"  width="18" height="8"  rx="3"   fill={col} />

                {/* 십자가 — 우측 수평 암 */}
                <rect x="26" y="9"  width="18" height="8"  rx="3"   fill={col} />

                {/* 수직 커넥터 (십자가 중심 → 핀 원) */}
                <rect x="18" y="9"  width="8"  height="16"          fill={col} />

                {/* 핀 본체 원 */}
                <circle cx="22" cy="40" r="17" fill={col} />

                {/* 핀 포인트 (아래 삼각형) */}
                <path d="M 11 53 L 22 64 L 33 53 Z" fill={col} />

                {/* 골드 내부 원 */}
                <circle cx="22" cy="40" r="8" fill={gold} />
            </svg>

            {/* ── 워드마크 ──────────────────────────────── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                <span
                    style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: fontSize + "px",
                        fontWeight: 700,
                        color: txt,
                        letterSpacing: "0.12em",
                        lineHeight: 1,
                        display: "block",
                        userSelect: "none",
                    }}
                >
                    CATHOLICA
                </span>

                {showSubtitle && (
                    <span
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            fontSize: subFontSize + "px",
                            color: sub,
                            letterSpacing: "0.04em",
                            display: "block",
                            marginTop: "3px",
                            lineHeight: 1,
                            userSelect: "none",
                        }}
                    >
                        가톨릭 행사 허브
                    </span>
                )}
            </div>
        </button>
    );
}
