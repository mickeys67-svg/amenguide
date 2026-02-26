"use client";

import { useRouter } from "next/navigation";

interface LogoProps {
    /** "dark" = 원본 이미지 (네이비, 밝은 배경용)
     *  "light" = 흰색 필터 (어두운 배경용: auth 패널, admin 사이드바) */
    variant?: "dark" | "light";
    /** 로고 이미지 높이(px) — 가로는 자동 비율 유지 */
    size?: number;
    /** API 호환성 유지용 (이미지에 텍스트 포함되어 있어 실제로는 무시됨) */
    showSubtitle?: boolean;
    /** 클릭 핸들러 — 기본값: router.push("/") */
    onClick?: () => void;
    style?: React.CSSProperties;
    className?: string;
}

export function Logo({
    variant = "dark",
    size = 28,
    onClick,
    style,
    className,
}: LogoProps) {
    const router = useRouter();

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
                display: "inline-flex",
                alignItems: "center",
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 0,
                ...style,
            }}
            aria-label="Catholica — 홈으로"
        >
            <img
                src="/logo.png"
                alt="CATHOLICA 가톨릭 행사 허브"
                style={{
                    height: size + "px",
                    width: "auto",
                    display: "block",
                    filter: variant === "light" ? "brightness(0) invert(1)" : "none",
                }}
            />
        </button>
    );
}
