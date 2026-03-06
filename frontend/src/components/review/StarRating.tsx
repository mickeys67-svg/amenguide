"use client";

import { useState } from "react";

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    size?: number;
    readOnly?: boolean;
}

export function StarRating({ value, onChange, size = 20, readOnly = false }: StarRatingProps) {
    const [hover, setHover] = useState(0);

    return (
        <div style={{ display: "inline-flex", gap: "2px" }}>
            {[1, 2, 3, 4, 5].map((star) => {
                const filled = star <= (hover || value);
                return (
                    <button
                        key={star}
                        type="button"
                        disabled={readOnly}
                        onClick={() => onChange?.(star)}
                        onMouseEnter={() => !readOnly && setHover(star)}
                        onMouseLeave={() => !readOnly && setHover(0)}
                        style={{
                            background: "none",
                            border: "none",
                            cursor: readOnly ? "default" : "pointer",
                            padding: "1px",
                            lineHeight: 1,
                            transition: "transform 0.12s ease",
                            transform: !readOnly && hover === star ? "scale(1.2)" : "scale(1)",
                        }}
                        aria-label={`${star}점`}
                    >
                        <svg
                            width={size}
                            height={size}
                            viewBox="0 0 24 24"
                            fill={filled ? "#C9A96E" : "none"}
                            stroke={filled ? "#C9A96E" : "#D0CDC7"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                    </button>
                );
            })}
        </div>
    );
}
