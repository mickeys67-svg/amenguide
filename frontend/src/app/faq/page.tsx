import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "자주 묻는 질문 | Catholica",
    description: "Catholica 서비스 이용에 관해 자주 묻는 질문과 답변",
};

const H2: React.CSSProperties = {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: "clamp(18px, 2.4vw, 22px)",
    fontWeight: 700,
    color: "#0B2040",
    marginBottom: 0,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};
const P: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.85,
    color: "#52504B",
    marginBottom: 0,
    marginTop: 12,
};

interface FaqItem {
    q: string;
    a: string | string[];
}

interface FaqSection {
    title: string;
    icon: string;
    items: FaqItem[];
}

const FAQ_DATA: FaqSection[] = [
    {
        title: "서비스 소개",
        icon: "✦",
        items: [
            {
                q: "Catholica는 어떤 서비스인가요?",
                a: "Catholica는 전국의 가톨릭 행사 정보(피정, 강의, 강론, 특강, 미사, 순례 등)를 한곳에 모아 제공하는 비영리 정보 안내 서비스입니다. 복음 선포와 신앙 성장을 돕기 위한 순수한 사도직 활동으로 운영됩니다.",
            },
            {
                q: "서비스 이용 요금이 있나요?",
                a: "아니요. Catholica의 모든 기능은 무료로 제공됩니다. 행사 검색, 상세 정보 열람, 지도 보기 등 모든 기능을 비용 없이 이용하실 수 있습니다.",
            },
            {
                q: "회원가입 없이도 이용할 수 있나요?",
                a: "네. 행사 검색, 상세 정보 확인, 지도 보기 등 대부분의 기능은 로그인 없이 자유롭게 이용하실 수 있습니다.",
            },
            {
                q: "행사 정보는 어디에서 수집되나요?",
                a: "전국 교구 홈페이지, 한국천주교주교회의(CBCK), 가톨릭 매체, 수도회 및 피정의집 등의 공개된 행사 공지를 자동으로 수집하여 정리합니다. AI 기술을 활용해 행사 내용을 요약하고 카테고리별로 분류합니다.",
            },
        ],
    },
    {
        title: "행사 검색 및 이용",
        icon: "◈",
        items: [
            {
                q: "행사를 어떻게 검색하나요?",
                a: [
                    "두 가지 방법으로 검색할 수 있습니다.",
                    "① 키워드 검색: 상단 검색 아이콘을 클릭하거나 Ctrl+K(Mac: ⌘+K)를 눌러 행사 제목, 장소, 카테고리를 검색합니다.",
                    "② AI 의미 검색: 검색창에서 '의미 검색' 탭을 선택하면 \"조용한 피정\"처럼 자연스러운 문장으로 검색할 수 있습니다.",
                ],
            },
            {
                q: "어떤 카테고리의 행사를 볼 수 있나요?",
                a: [
                    "현재 다음 카테고리의 행사를 제공합니다.",
                    "• 피정 — 영성 수련 및 묵상 프로그램",
                    "• 강의 — 성경, 교리, 신학 강좌",
                    "• 강론 — 사제의 말씀 및 특별 강론",
                    "• 특강 — 초청 강연, 세미나",
                    "• 미사 — 특별 전례, 축일 미사",
                    "• 순례 — 성지순례, 도보순례",
                    "• 청년 — 청년 대상 프로그램",
                    "• 문화 — 성음악, 전시, 공연",
                    "• 선교 — 선교 활동 및 봉사",
                ],
            },
            {
                q: "내 위치 근처의 행사를 찾을 수 있나요?",
                a: "네. 정렬 옵션에서 '거리순'을 선택하면 현재 위치에서 가까운 행사부터 표시됩니다. 브라우저에서 위치 정보 사용을 허용해 주셔야 합니다. 지도 보기에서도 내 주변 행사를 시각적으로 확인할 수 있습니다.",
            },
            {
                q: "행사 상세 페이지에서 볼 수 있는 정보는 무엇인가요?",
                a: "행사 제목, 카테고리, 일시, 장소, AI 요약 설명을 확인할 수 있습니다. '원본 보기' 버튼을 누르면 행사를 게시한 원래 웹사이트로 이동하여 더 자세한 정보를 확인할 수 있습니다.",
            },
        ],
    },
    {
        title: "행사 참가 및 등록",
        icon: "◇",
        items: [
            {
                q: "Catholica에서 행사에 직접 신청할 수 있나요?",
                a: "아니요. Catholica는 행사 정보를 안내하는 플랫폼이며, 행사 주최 기관이 아닙니다. 참가 신청은 각 행사의 원본 페이지(주최 기관 홈페이지)에서 직접 하셔야 합니다. 행사 상세 페이지의 '원본 보기' 링크를 통해 주최 기관 페이지로 이동할 수 있습니다.",
            },
            {
                q: "행사 정보가 실제와 다르면 어떻게 하나요?",
                a: "행사 일정이나 내용이 변경될 수 있으므로, 참가 전 반드시 주최 기관의 원본 페이지에서 최신 정보를 확인해 주세요. 잘못된 정보를 발견하시면 mickeys67@gmail.com으로 알려주시면 신속하게 수정하겠습니다.",
            },
            {
                q: "행사를 등록하고 싶은데 어떻게 하나요?",
                a: "관리자 페이지를 통해 행사를 등록할 수 있습니다. 등록된 행사는 관리자 검토를 거쳐 승인 후 사이트에 게시됩니다. 행사 등록에 관해 문의가 있으시면 mickeys67@gmail.com으로 연락해 주세요.",
            },
        ],
    },
    {
        title: "계정 및 개인정보",
        icon: "◎",
        items: [
            {
                q: "회원가입은 어떻게 하나요?",
                a: "카카오, 구글, 네이버 계정으로 간편하게 로그인할 수 있습니다. 별도의 아이디/비밀번호 가입 절차는 없습니다.",
            },
            {
                q: "어떤 개인정보를 수집하나요?",
                a: [
                    "소셜 로그인 시 다음 정보만 수집합니다.",
                    "• 카카오: 닉네임, 이메일, 프로필 사진(선택)",
                    "• 구글: 이름, 이메일, 프로필 사진(선택)",
                    "• 네이버: 닉네임, 이메일, 프로필 사진(선택)",
                    "수집된 정보는 서비스 제공 목적으로만 사용되며, 광고나 마케팅 등 상업적 목적으로는 절대 이용되지 않습니다.",
                ],
            },
            {
                q: "개인정보를 삭제하고 싶으면 어떻게 하나요?",
                a: "mickeys67@gmail.com으로 개인정보 삭제를 요청하시면 지체 없이 처리해 드립니다. 자세한 내용은 개인정보처리방침 페이지를 참고해 주세요.",
            },
        ],
    },
    {
        title: "기타",
        icon: "※",
        items: [
            {
                q: "Catholica는 천주교회 공식 기관인가요?",
                a: "아니요. Catholica는 천주교 신자가 운영하는 비영리 개인 프로젝트입니다. 한국천주교주교회의나 특정 교구의 공식 서비스는 아니지만, 천주교 교리와 가르침을 존중하며 복음 선포에 기여하고자 합니다.",
            },
            {
                q: "모바일에서도 이용할 수 있나요?",
                a: "네. 반응형 웹 디자인이 적용되어 있어 스마트폰, 태블릿, PC 등 모든 기기에서 편리하게 이용하실 수 있습니다.",
            },
            {
                q: "오류 신고 및 문의는 어디로 하나요?",
                a: "서비스 이용 중 문제가 발생하거나 문의 사항이 있으시면 mickeys67@gmail.com으로 연락해 주세요.",
            },
        ],
    },
];

export default function FaqPage() {
    return (
        <main
            style={{
                maxWidth: 800,
                margin: "0 auto",
                padding: "clamp(80px, 10vw, 120px) clamp(20px, 4vw, 40px) 80px",
                fontFamily: "'Noto Sans KR', sans-serif",
            }}
        >
            {/* Header */}
            <p
                style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 12,
                    color: "#C9A96E",
                    letterSpacing: "0.15em",
                    marginBottom: 12,
                }}
            >
                FAQ
            </p>
            <h1
                style={{
                    fontFamily: "'Noto Serif KR', serif",
                    fontSize: "clamp(28px, 4vw, 40px)",
                    fontWeight: 900,
                    color: "#0B2040",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.3,
                    marginBottom: 16,
                }}
            >
                자주 묻는 질문
            </h1>
            <p
                style={{
                    fontSize: 15,
                    lineHeight: 1.8,
                    color: "#52504B",
                    marginBottom: 48,
                    maxWidth: 520,
                }}
            >
                Catholica 서비스 이용에 관해 궁금하신 점을 모았습니다.
                <br />
                아래에서 답변을 찾지 못하셨다면{" "}
                <a
                    href="mailto:mickeys67@gmail.com"
                    style={{ color: "#0B2040", textDecoration: "underline", textUnderlineOffset: 3 }}
                >
                    mickeys67@gmail.com
                </a>
                으로 문의해 주세요.
            </p>

            {/* FAQ Sections */}
            {FAQ_DATA.map((section, si) => (
                <section
                    key={si}
                    style={{
                        marginBottom: 48,
                    }}
                >
                    {/* Section Title */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 24,
                            paddingBottom: 12,
                            borderBottom: "2px solid #0B2040",
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'DM Mono', monospace",
                                fontSize: 14,
                                color: "#C9A96E",
                            }}
                        >
                            {section.icon}
                        </span>
                        <h2
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                fontSize: "clamp(16px, 2.2vw, 20px)",
                                fontWeight: 700,
                                color: "#0B2040",
                                letterSpacing: "-0.01em",
                            }}
                        >
                            {section.title}
                        </h2>
                    </div>

                    {/* Questions */}
                    {section.items.map((item, qi) => (
                        <details
                            key={qi}
                            style={{
                                borderBottom: "1px solid #E8E5DF",
                            }}
                        >
                            <summary
                                style={{
                                    ...H2,
                                    fontSize: "clamp(15px, 2vw, 17px)",
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontWeight: 600,
                                    padding: "18px 0",
                                    listStyle: "none",
                                    WebkitAppearance: "none",
                                }}
                            >
                                <span style={{ flex: 1, paddingRight: 16 }}>{item.q}</span>
                                <span
                                    style={{
                                        fontSize: 18,
                                        color: "#9C9891",
                                        transition: "transform 0.2s ease",
                                        flexShrink: 0,
                                    }}
                                    className="faq-chevron"
                                >
                                    +
                                </span>
                            </summary>
                            <div style={{ padding: "0 0 20px 0" }}>
                                {Array.isArray(item.a) ? (
                                    item.a.map((line, li) => (
                                        <p key={li} style={{ ...P, marginTop: li === 0 ? 0 : 6 }}>
                                            {line}
                                        </p>
                                    ))
                                ) : (
                                    <p style={{ ...P, marginTop: 0 }}>{item.a}</p>
                                )}
                            </div>
                        </details>
                    ))}
                </section>
            ))}

            {/* Bottom CTA */}
            <div
                style={{
                    marginTop: 56,
                    padding: "32px",
                    backgroundColor: "#F0EFE9",
                    borderRadius: 12,
                    textAlign: "center",
                }}
            >
                <p
                    style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: "clamp(16px, 2.2vw, 20px)",
                        fontWeight: 700,
                        color: "#0B2040",
                        marginBottom: 8,
                    }}
                >
                    원하시는 답변을 찾지 못하셨나요?
                </p>
                <p style={{ fontSize: 14, color: "#52504B", marginBottom: 20 }}>
                    언제든지 이메일로 문의해 주세요.
                </p>
                <a
                    href="mailto:mickeys67@gmail.com"
                    style={{
                        display: "inline-block",
                        backgroundColor: "#0B2040",
                        color: "#FFFFFF",
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: 14,
                        fontWeight: 600,
                        padding: "12px 28px",
                        borderRadius: 8,
                        textDecoration: "none",
                        letterSpacing: "0.02em",
                    }}
                >
                    mickeys67@gmail.com
                </a>
            </div>

            {/* Footer links */}
            <div
                style={{
                    marginTop: 48,
                    display: "flex",
                    gap: 24,
                    justifyContent: "center",
                }}
            >
                <Link
                    href="/privacy"
                    style={{ fontSize: 13, color: "#9C9891", textDecoration: "none" }}
                >
                    개인정보처리방침
                </Link>
                <Link
                    href="/terms"
                    style={{ fontSize: 13, color: "#9C9891", textDecoration: "none" }}
                >
                    이용약관
                </Link>
                <Link
                    href="/"
                    style={{ fontSize: 13, color: "#9C9891", textDecoration: "none" }}
                >
                    홈으로
                </Link>
            </div>

            {/* CSS for details/summary */}
            <style>{`
                details summary::-webkit-details-marker { display: none; }
                details summary::marker { display: none; content: ""; }
                details[open] .faq-chevron { transform: rotate(45deg); }
                details summary:hover { color: #183568; }
            `}</style>
        </main>
    );
}
