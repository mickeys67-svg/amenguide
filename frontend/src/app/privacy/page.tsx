import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "개인정보처리방침 | Catholica",
    description: "Catholica 개인정보처리방침",
};

const SECTION_STYLE: React.CSSProperties = { marginBottom: 40 };
const H2: React.CSSProperties = {
    fontFamily: "'Noto Serif KR', serif",
    fontSize: "clamp(18px, 2.4vw, 22px)",
    fontWeight: 700,
    color: "#0B2040",
    marginBottom: 16,
};
const P: React.CSSProperties = {
    fontSize: 15,
    lineHeight: 1.85,
    color: "#52504B",
    marginBottom: 10,
};
const TABLE: React.CSSProperties = {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: 14,
    marginBottom: 10,
};
const TH: React.CSSProperties = {
    textAlign: "left",
    padding: "10px 14px",
    backgroundColor: "#F0EFE9",
    borderBottom: "1px solid #E8E5DF",
    fontWeight: 600,
    color: "#100F0F",
};
const TD: React.CSSProperties = {
    padding: "10px 14px",
    borderBottom: "1px solid #E8E5DF",
    color: "#52504B",
    lineHeight: 1.6,
};

export default function PrivacyPage() {
    return (
        <main
            style={{
                maxWidth: 800,
                margin: "0 auto",
                padding: "clamp(80px, 10vw, 120px) clamp(20px, 4vw, 40px) 80px",
            }}
        >
            {/* Header */}
            <div style={{ marginBottom: 48 }}>
                <Link
                    href="/"
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: "#C9A96E",
                        textDecoration: "none",
                        letterSpacing: "0.05em",
                    }}
                >
                    &larr; CATHOLICA
                </Link>
                <h1
                    style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: "clamp(26px, 3.5vw, 34px)",
                        fontWeight: 900,
                        color: "#0B2040",
                        marginTop: 20,
                        marginBottom: 8,
                    }}
                >
                    개인정보처리방침
                </h1>
                <p
                    style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: 13,
                        color: "#9C9891",
                    }}
                >
                    시행일: 2026년 3월 6일
                </p>
            </div>

            {/* 서비스 소개 */}
            <section
                style={{
                    ...SECTION_STYLE,
                    backgroundColor: "#F8F7F4",
                    borderLeft: "3px solid #C9A96E",
                    padding: "20px 24px",
                    borderRadius: 8,
                }}
            >
                <p style={{ ...P, marginBottom: 0 }}>
                    Catholica(이하 &ldquo;서비스&rdquo;)는 천주교 신자들이
                    피정, 강의, 강론, 특강 등 다양한 가톨릭 행사 정보를 쉽고
                    편리하게 찾을 수 있도록 돕는 <strong>비영리 정보 안내
                    서비스</strong>입니다. 본 서비스는 그리스도의 복음 전파와
                    천주교 신앙의 선교를 위한 <strong>순수한 사도직
                    활동</strong>으로 운영되며, 어떠한 상업적 이익도 추구하지
                    않습니다. 수집하는 개인정보는 오직 이용자의 편의를 위한
                    최소한의 범위로 한정하며, 천주교 교회법과 대한민국
                    개인정보보호법을 성실히 준수합니다.
                </p>
            </section>

            {/* 1 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>1. 개인정보의 수집 항목 및 방법</h2>
                <p style={P}>
                    서비스는 소셜 로그인을 통해
                    아래의 개인정보를 수집합니다.
                </p>
                <table style={TABLE}>
                    <thead>
                        <tr>
                            <th style={TH}>로그인 방식</th>
                            <th style={TH}>수집 항목</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={TD}>카카오 로그인</td>
                            <td style={TD}>
                                닉네임, 이메일, 프로필 이미지(선택)
                            </td>
                        </tr>
                        <tr>
                            <td style={TD}>구글 로그인</td>
                            <td style={TD}>
                                이름, 이메일, 프로필 이미지(선택)
                            </td>
                        </tr>
                        <tr>
                            <td style={TD}>네이버 로그인</td>
                            <td style={TD}>
                                닉네임, 이메일, 프로필 이미지(선택)
                            </td>
                        </tr>
                    </tbody>
                </table>
                <p style={P}>
                    서비스는 자체 회원가입을 제공하지 않으며, 위 소셜 로그인
                    제공자의 인증 과정을 통해서만 개인정보를 수집합니다.
                </p>
            </section>

            {/* 2 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>2. 개인정보의 수집 및 이용 목적</h2>
                <p style={P}>
                    서비스는 비영리 선교 활동의 일환으로 운영되며, 수집된
                    개인정보는 이용자의 행사 정보 탐색을 돕기 위한 다음
                    목적으로만 이용됩니다.
                </p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        회원 식별 및 로그인 상태 유지
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        관심 행사 저장 등 개인화 기능 제공
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        서비스 이용 관련 공지 및 안내
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        서비스 개선을 위한 통계 분석 (비식별 처리)
                    </li>
                </ul>
                <p style={P}>
                    수집된 개인정보는 광고, 마케팅, 상업적 목적으로 절대
                    이용되지 않습니다.
                </p>
            </section>

            {/* 3 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>3. 개인정보의 보유 및 이용 기간</h2>
                <p style={P}>
                    회원 탈퇴 시 수집된 개인정보는 지체 없이 파기합니다. 단,
                    관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
                </p>
                <table style={TABLE}>
                    <thead>
                        <tr>
                            <th style={TH}>보존 근거</th>
                            <th style={TH}>보존 기간</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={TD}>
                                전자상거래 등에서의 소비자 보호에 관한 법률
                            </td>
                            <td style={TD}>
                                계약 또는 청약 철회 기록: 5년
                            </td>
                        </tr>
                        <tr>
                            <td style={TD}>통신비밀보호법</td>
                            <td style={TD}>
                                서비스 이용 기록, 접속 로그: 3개월
                            </td>
                        </tr>
                    </tbody>
                </table>
            </section>

            {/* 4 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>4. 개인정보의 제3자 제공</h2>
                <p style={P}>
                    서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지
                    않습니다. 다만, 이용자의 사전 동의가 있거나 법령에 의한
                    요청이 있는 경우에 한하여 예외적으로 제공할 수 있습니다.
                </p>
            </section>

            {/* 5 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>5. 개인정보의 파기 절차 및 방법</h2>
                <p style={P}>
                    이용 목적이 달성된 개인정보는 아래와 같이 파기합니다.
                </p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        <strong>전자적 파일:</strong> 복구할 수 없는 기술적
                        방법으로 영구 삭제
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        <strong>종이 문서:</strong> 분쇄 또는 소각 (해당 시)
                    </li>
                </ul>
            </section>

            {/* 6 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>6. 이용자의 권리와 행사 방법</h2>
                <p style={P}>
                    이용자는 언제든지 아래의 권리를 행사할 수 있습니다.
                </p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        개인정보 열람, 정정, 삭제 요청
                    </li>
                    <li style={{ marginBottom: 6 }}>회원 탈퇴 (계정 삭제)</li>
                    <li style={{ marginBottom: 6 }}>
                        개인정보 처리 정지 요청
                    </li>
                </ul>
                <p style={P}>
                    위 요청은 서비스 내 설정 페이지 또는 아래 연락처를 통해
                    가능합니다.
                </p>
            </section>

            {/* 7 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>7. 쿠키 및 자동 수집 장치</h2>
                <p style={P}>
                    서비스는 로그인 세션 유지를 위해 쿠키를 사용할 수 있습니다.
                    이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며,
                    이 경우 로그인이 필요한 일부 기능 이용이 제한될 수 있습니다.
                </p>
            </section>

            {/* 8 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>8. 개인정보 보호 책임자</h2>
                <table style={TABLE}>
                    <tbody>
                        <tr>
                            <td style={{ ...TD, fontWeight: 600, width: 120 }}>
                                서비스명
                            </td>
                            <td style={TD}>Catholica</td>
                        </tr>
                        <tr>
                            <td style={{ ...TD, fontWeight: 600 }}>이메일</td>
                            <td style={TD}>mickeys67@gmail.com</td>
                        </tr>
                    </tbody>
                </table>
                <p style={P}>
                    개인정보 침해에 관한 신고·상담이 필요한 경우 아래 기관에
                    문의할 수 있습니다.
                </p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        개인정보침해 신고센터 (privacy.kisa.or.kr / 118)
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        대검찰청 사이버수사과 (spo.go.kr / 1301)
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        경찰청 사이버안전국 (police.go.kr / 182)
                    </li>
                </ul>
            </section>

            {/* 9 */}
            <section style={{ marginBottom: 60 }}>
                <h2 style={H2}>9. 방침 변경 안내</h2>
                <p style={P}>
                    본 개인정보처리방침이 변경되는 경우, 시행일 7일 전부터
                    서비스 공지사항을 통해 안내합니다.
                </p>
            </section>

            {/* Footer nav */}
            <div
                style={{
                    borderTop: "1px solid #E8E5DF",
                    paddingTop: 24,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Link
                    href="/"
                    style={{ fontSize: 14, color: "#9C9891", textDecoration: "none" }}
                >
                    &larr; 홈으로
                </Link>
                <Link
                    href="/terms"
                    style={{ fontSize: 14, color: "#0B2040", textDecoration: "none", fontWeight: 600 }}
                >
                    이용약관 &rarr;
                </Link>
            </div>
        </main>
    );
}
