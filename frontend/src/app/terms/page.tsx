import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
    title: "이용약관 | Catholica",
    description: "Catholica 서비스 이용약관",
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

export default function TermsPage() {
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
                    이용약관
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

            {/* 전문 */}
            <section
                style={{
                    ...SECTION_STYLE,
                    backgroundColor: "#F8F7F4",
                    borderLeft: "3px solid #C9A96E",
                    padding: "20px 24px",
                    borderRadius: 8,
                }}
            >
                <p
                    style={{
                        ...P,
                        fontFamily: "'Noto Serif KR', serif",
                        fontStyle: "italic",
                        color: "#0B2040",
                        marginBottom: 12,
                    }}
                >
                    &ldquo;너희는 온 세상에 가서 모든 피조물에게 복음을
                    선포하여라.&rdquo; (마르 16,15)
                </p>
                <p style={{ ...P, marginBottom: 0 }}>
                    Catholica는 위 말씀에 따라, 천주교 신자들이 피정·강의·강론·특강
                    등 다양한 신앙 행사를 쉽고 편리하게 찾을 수 있도록 돕는{" "}
                    <strong>비영리 정보 안내 서비스</strong>입니다. 본 서비스는
                    그리스도의 복음 전파와 천주교 신앙의 선교를 위한{" "}
                    <strong>순수한 사도직 활동</strong>으로 운영되며, 어떠한
                    상업적 이익도 추구하지 않습니다.
                </p>
            </section>

            {/* 1 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제1조 (목적)</h2>
                <p style={P}>
                    이 약관은 Catholica(이하 &ldquo;서비스&rdquo;)가 제공하는
                    가톨릭 행사 정보 안내 서비스의 이용과 관련하여 서비스와 이용자
                    간의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
                    서비스는 천주교 교리에 따른 복음 선교와 신앙생활 지원을 위해
                    비영리로 운영됩니다.
                </p>
            </section>

            {/* 2 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제2조 (정의)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        &ldquo;서비스&rdquo;란 Catholica가 운영하는 웹사이트
                        (catholica.kr)를 통해 제공하는 전국 가톨릭 행사
                        정보 안내 서비스를 말합니다. 본 서비스는 신자들의
                        신앙생활을 돕고 복음 선교에 이바지하기 위한 비영리
                        사도직 활동입니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        &ldquo;이용자&rdquo;란 이 약관에 따라 서비스를 이용하는
                        자를 말합니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        &ldquo;회원&rdquo;이란 소셜 로그인(카카오, 구글,
                        네이버)을 통해 서비스에 가입한 이용자를 말합니다.
                    </li>
                </ol>
            </section>

            {/* 3 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제3조 (약관의 효력과 변경)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        이 약관은 서비스 화면에 게시하거나 기타 방법으로
                        이용자에게 공지함으로써 효력이 발생합니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        서비스는 합리적인 사유가 있을 경우 약관을 변경할 수
                        있으며, 변경 시 시행일 7일 전 공지합니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        변경된 약관에 동의하지 않는 이용자는 서비스 이용을
                        중단하고 회원 탈퇴를 할 수 있습니다.
                    </li>
                </ol>
            </section>

            {/* 4 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제4조 (회원 가입 및 탈퇴)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        회원 가입은 카카오, 구글, 네이버 소셜 로그인을 통해서만
                        가능합니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        이용자가 소셜 로그인을 완료하고 이 약관에 동의하면
                        회원 가입이 완료됩니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        회원은 언제든지 서비스 내 설정을 통해 탈퇴할 수 있으며,
                        탈퇴 시 개인정보는 개인정보처리방침에 따라 처리됩니다.
                    </li>
                </ol>
            </section>

            {/* 5 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제5조 (서비스의 성격 및 내용)</h2>
                <p style={P}>
                    서비스는 이용자가 원하는 가톨릭 행사 정보를 쉽고 빠르게
                    찾을 수 있도록 돕는 <strong>정보 안내 플랫폼</strong>이며,
                    다음 기능을 제공합니다.
                </p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        전국 가톨릭 행사(피정, 강의, 강론, 특강 등) 정보 제공
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        카테고리별 행사 검색 및 필터링
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        행사 상세 정보 및 위치 안내
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        관심 행사 저장 기능 (회원 한정)
                    </li>
                </ul>
                <p style={P}>
                    서비스는 행사의 주최·주관 기관이 아니며, 행사 등록·접수·결제
                    등의 기능을 직접 제공하지 않습니다. 모든 행사에 대한 문의와
                    신청은 해당 주최 기관에 직접 하시기 바랍니다.
                </p>
            </section>

            {/* 6 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제6조 (서비스 이용)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스는 연중무휴 24시간 제공을 원칙으로 합니다. 다만,
                        시스템 점검이나 기술적 장애 시 일시적으로 중단될 수
                        있습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        비회원도 행사 정보 열람이 가능하며, 관심 행사 저장 등
                        일부 기능은 로그인이 필요합니다.
                    </li>
                </ol>
            </section>

            {/* 7 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제7조 (비영리 운영 원칙)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스는 천주교 복음 선교와 신앙생활 지원이라는 순수한
                        목적을 위해 비영리로 운영되며, 이용자에게 어떠한 이용
                        요금도 부과하지 않습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        서비스는 유료 콘텐츠 판매, 개인정보의 상업적
                        활용 등 영리 행위를 하지 않습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        서비스의 운영에 필요한 비용은 자발적인 후원 또는
                        운영자의 개인 부담으로 충당됩니다.
                    </li>
                </ol>
            </section>

            {/* 8 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제8조 (이용자의 의무)</h2>
                <p style={P}>이용자는 다음 행위를 하여서는 안 됩니다.</p>
                <ul style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 6 }}>
                        허위 정보를 등록하거나 타인의 정보를 도용하는 행위
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        서비스의 운영을 방해하거나 비정상적인 방법으로 이용하는
                        행위
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        서비스 내 정보를 무단으로 수집, 복제, 배포하는 행위
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        천주교 교리와 가르침에 반하는 내용을 게시하거나
                        신앙을 모독하는 행위
                    </li>
                    <li style={{ marginBottom: 6 }}>
                        기타 관련 법령이나 공공질서에 위배되는 행위
                    </li>
                </ul>
            </section>

            {/* 9 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제9조 (행사 정보의 정확성)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스에 게시된 행사 정보는 각 교구, 성당, 단체 등의
                        공개 자료를 기반으로 수집 및 정리한 것입니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        행사의 일정, 장소, 내용 등은 주최 측 사정에 의해 변경될
                        수 있으며, 서비스는 실시간 정확성을 보증하지 않습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        정확한 행사 정보는 해당 주최 기관에 직접 확인하시기
                        바랍니다.
                    </li>
                </ol>
            </section>

            {/* 10 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제10조 (지식재산권)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스의 디자인, 로고, 소프트웨어 등에 대한
                        지식재산권은 서비스 운영자에게 귀속됩니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        행사 정보의 원본 저작권은 각 행사 주최 기관에 있으며,
                        서비스는 정보 안내 목적으로만 해당 내용을 제공합니다.
                    </li>
                </ol>
            </section>

            {/* 11 */}
            <section style={SECTION_STYLE}>
                <h2 style={H2}>제11조 (면책 사항)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스는 천재지변, 시스템 장애 등 불가항력으로 인한
                        서비스 중단에 대해 책임을 지지 않습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        서비스에서 제공하는 행사 정보를 기반으로 이용자가 내린
                        결정에 대해 서비스는 책임을 지지 않습니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        외부 링크를 통해 연결되는 제3자 사이트의 내용이나
                        서비스에 대해서는 책임을 지지 않습니다.
                    </li>
                </ol>
            </section>

            {/* 12 */}
            <section style={{ marginBottom: 60 }}>
                <h2 style={H2}>제12조 (분쟁 해결)</h2>
                <ol style={{ ...P, paddingLeft: 20 }}>
                    <li style={{ marginBottom: 8 }}>
                        서비스 이용과 관련하여 발생한 분쟁은 상호 협의하여
                        해결합니다.
                    </li>
                    <li style={{ marginBottom: 8 }}>
                        협의가 이루어지지 않을 경우, 관련 법령에 따른
                        관할 법원에 소를 제기할 수 있습니다.
                    </li>
                </ol>
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
                    href="/privacy"
                    style={{ fontSize: 14, color: "#0B2040", textDecoration: "none", fontWeight: 600 }}
                >
                    &larr; 개인정보처리방침
                </Link>
                <Link
                    href="/"
                    style={{ fontSize: 14, color: "#9C9891", textDecoration: "none" }}
                >
                    홈으로 &rarr;
                </Link>
            </div>
        </main>
    );
}
