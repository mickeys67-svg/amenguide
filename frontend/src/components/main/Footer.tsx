"use client";

import React from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const LINKS: Record<string, { label: string; href: string | null }[]> = {
    카테고리: [
        { label: "피정",     href: "/?category=피정"     },
        { label: "강의",     href: "/?category=강의"     },
        { label: "강론",     href: "/?category=강론"     },
        { label: "특강",     href: "/?category=특강"     },
        { label: "피정의집", href: "/?category=피정의집" },
    ],
    정보: [
        { label: "행사 등록",       href: "/admin" },
        { label: "이용 안내",       href: null     },
        { label: "단체 파트너십",   href: null     },
        { label: "자주 묻는 질문",  href: null     },
    ],
    연결: [
        { label: "카카오 채널",   href: null },
        { label: "뉴스레터 구독", href: null },
    ],
};

export function Footer() {
    const currentYear = new Date().getFullYear();
    const [newsletterMsg, setNewsletterMsg] = React.useState("");

    return (
        <footer
            style={{
                backgroundColor: "#F0EFE9",
                borderTop: "1px solid #E8E5DF",
            }}
        >
            <div className="sacred-rail" style={{ paddingTop: "56px", paddingBottom: "48px" }}>

                {/* Top: Brand + Newsletter */}
                <div
                    className="grid md:grid-cols-2 gap-10 md:gap-16"
                    style={{ marginBottom: "52px" }}
                >
                    {/* Brand */}
                    <div>
                        {/* Logo */}
                        <div className="flex items-center gap-2.5" style={{ marginBottom: "20px" }}>
                            <svg width="15" height="19" viewBox="0 0 15 19" fill="none">
                                <rect x="6" y="0" width="3" height="19" rx="1.5" fill="#0B2040" />
                                <rect x="0" y="4" width="15" height="3" rx="1.5" fill="#0B2040" />
                            </svg>
                            <div>
                                <span
                                    style={{
                                        fontFamily: "'Noto Serif KR', serif",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        color: "#0B2040",
                                        letterSpacing: "0.12em",
                                        display: "block",
                                        lineHeight: 1,
                                    }}
                                >
                                    CATHOLICA
                                </span>
                                <span
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "9px",
                                        color: "#9C9891",
                                        letterSpacing: "0.04em",
                                        display: "block",
                                        marginTop: "3px",
                                        lineHeight: 1,
                                    }}
                                >
                                    가톨릭 행사 허브
                                </span>
                            </div>
                        </div>

                        {/* Tagline */}
                        <h2
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#100F0F",
                                fontSize: "clamp(22px, 3.2vw, 34px)",
                                fontWeight: 700,
                                letterSpacing: "-0.02em",
                                lineHeight: 1.3,
                                marginBottom: "14px",
                            }}
                        >
                            하느님의 부르심에<br />
                            <span style={{ color: "#0B2040" }}>응답하는 여정</span>
                        </h2>

                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "#52504B",
                                fontSize: "13px",
                                lineHeight: 1.9,
                                fontWeight: 300,
                                maxWidth: "300px",
                            }}
                        >
                            전국의 피정, 강의, 강론, 특강 정보를
                            한곳에 모아 드립니다.
                        </p>
                    </div>

                    {/* Newsletter */}
                    <div className="flex flex-col justify-end">
                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "#100F0F",
                                fontSize: "15px",
                                fontWeight: 600,
                                marginBottom: "14px",
                            }}
                        >
                            새로운 행사 소식 받기
                        </p>
                        <div
                            style={{
                                display: "flex",
                                borderBottom: "1px solid #D0CDC7",
                            }}
                        >
                            <input
                                type="email"
                                aria-label="이메일 주소"
                                placeholder="이메일 주소를 입력하세요"
                                style={{
                                    flex: 1,
                                    backgroundColor: "transparent",
                                    padding: "10px 0",
                                    outline: "none",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "#100F0F",
                                    fontSize: "14px",
                                    fontWeight: 300,
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setNewsletterMsg("뉴스레터 서비스는 준비 중입니다.")}
                                className="flex items-center gap-1.5 pl-4 transition-opacity hover:opacity-60"
                                style={{ color: "#0B2040" }}
                            >
                                <span
                                    style={{
                                        fontFamily: "'Noto Sans KR', sans-serif",
                                        fontSize: "13px",
                                        fontWeight: 600,
                                    }}
                                >
                                    구독
                                </span>
                                <ArrowUpRight size={13} />
                            </button>
                        </div>
                        <p
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: newsletterMsg ? "#0B2040" : "#9C9891",
                                fontSize: "11px",
                                marginTop: "8px",
                                lineHeight: 1.6,
                            }}
                        >
                            {newsletterMsg || "매주 새로운 피정 및 행사 정보를 이메일로 받아보세요"}
                        </p>
                    </div>
                </div>

                {/* Links grid */}
                <div
                    className="grid grid-cols-2 md:grid-cols-3 gap-8"
                    style={{
                        paddingTop: "40px",
                        paddingBottom: "40px",
                        borderTop: "1px solid #E8E5DF",
                    }}
                >
                    {Object.entries(LINKS).map(([category, links]) => (
                        <div key={category}>
                            <p
                                style={{
                                    fontFamily: "'DM Mono', monospace",
                                    color: "#0B2040",
                                    fontSize: "10px",
                                    letterSpacing: "0.14em",
                                    textTransform: "uppercase",
                                    fontWeight: 500,
                                    marginBottom: "16px",
                                }}
                            >
                                {category}
                            </p>
                            <ul className="flex flex-col gap-2.5">
                                {links.map(({ label, href }) => (
                                    <li key={label}>
                                        {href ? (
                                            <Link
                                                href={href}
                                                style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    color: "#52504B",
                                                    fontSize: "13px",
                                                    fontWeight: 300,
                                                    textDecoration: "none",
                                                    transition: "color 0.15s ease",
                                                    display: "block",
                                                }}
                                                onMouseEnter={(e) =>
                                                    ((e.currentTarget as HTMLElement).style.color = "#0B2040")
                                                }
                                                onMouseLeave={(e) =>
                                                    ((e.currentTarget as HTMLElement).style.color = "#52504B")
                                                }
                                            >
                                                {label}
                                            </Link>
                                        ) : (
                                            <span
                                                title="준비 중"
                                                style={{
                                                    fontFamily: "'Noto Sans KR', sans-serif",
                                                    color: "#D0CDC7",
                                                    fontSize: "13px",
                                                    fontWeight: 300,
                                                }}
                                            >
                                                {label}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                    style={{
                        paddingTop: "24px",
                        borderTop: "1px solid #E8E5DF",
                    }}
                >
                    <p
                        style={{
                            fontFamily: "'DM Mono', monospace",
                            color: "#9C9891",
                            fontSize: "11px",
                            letterSpacing: "0.03em",
                        }}
                    >
                        © {currentYear} 가톨릭 행사 허브. All rights reserved.
                    </p>
                    <div className="flex items-center gap-5">
                        {["개인정보처리방침", "이용약관", "사이트맵"].map((item) => (
                            <a
                                key={item}
                                href="#"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "#9C9891",
                                    fontSize: "11px",
                                    textDecoration: "none",
                                    transition: "color 0.15s ease",
                                }}
                                onMouseEnter={(e) =>
                                    ((e.currentTarget as HTMLElement).style.color = "#0B2040")
                                }
                                onMouseLeave={(e) =>
                                    ((e.currentTarget as HTMLElement).style.color = "#9C9891")
                                }
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
}
