"use client";

import { useRouter } from "next/navigation";

interface LogoProps {
    /** "dark" = 네이비 마크 + 네이비 텍스트 (밝은 배경용)
     *  "light" = 흰색 마크 + 흰색 텍스트 (어두운 배경용) */
    variant?: "dark" | "light";
    /** 아이콘 마크 높이(px) — 텍스트는 비례 자동 계산 */
    size?: number;
    /** 부제목 "가톨릭 행사 허브" 표시 여부 (기본 true) */
    showSubtitle?: boolean;
    onClick?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

export function Logo({
    variant = "dark",
    size = 44,
    showSubtitle = true,
    onClick,
    style,
    className,
}: LogoProps) {
    const router = useRouter();

    const handleClick = () => {
        if (onClick) onClick();
        else router.push("/");
    };

    const col = variant === "dark" ? "#0B2040" : "#FFFFFF";
    const sub = variant === "dark" ? "#9C9891" : "rgba(255,255,255,0.55)";

    const titleSize    = Math.round(size * 0.38);
    const subtitleSize = Math.max(9, Math.round(size * 0.19));
    const gap          = Math.round(size * 0.18);

    return (
        <button
            type="button"
            onClick={handleClick}
            className={className}
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: gap + "px",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 0,
                ...style,
            }}
            aria-label="Catholica — 홈으로"
        >
            {/* 아이콘 마크 (텍스트 없는 PNG) */}
            <img
                src="/logo.png?v=3"
                alt=""
                style={{
                    height: size + "px",
                    width: "auto",
                    display: "block",
                    filter: variant === "light" ? "brightness(0) invert(1)" : "none",
                }}
            />

            {/* 워드마크 (코드로 렌더링) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontSize: titleSize + "px",
                    fontWeight: 700,
                    color: col,
                    letterSpacing: "0.10em",
                    lineHeight: 1,
                    display: "block",
                    userSelect: "none",
                }}>
                    CATHOLICA
                </span>
                {showSubtitle && (
                    <span style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: subtitleSize + "px",
                        color: sub,
                        letterSpacing: "0.05em",
                        display: "block",
                        lineHeight: 1,
                        userSelect: "none",
                    }}>
                        가톨릭 행사 허브
                    </span>
                )}
            </div>
        </button>
    );
}
