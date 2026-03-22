import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  title: "마음치유 심화 상담 | Catholica",
  description: "주님 안에서 당신의 마음이 쉼을 얻기를 기도합니다. 가톨릭 영성과 심리학이 함께하는 마음치유 심화 상담.",
  alternates: { canonical: `${SITE_URL}/healing` },
  openGraph: {
    title: "마음치유 심화 상담 — 당신의 마음이 쉼을 얻기를",
    description: "가톨릭 영성과 심리학이 함께하는 마음치유 심화 상담",
    url: `${SITE_URL}/healing`,
    siteName: "Catholica",
    locale: "ko_KR",
    type: "website",
  },
};

const JOURNEYS = [
  { icon: "🕊️", title: "영적 목마름과 아픔이 있는 분", desc: "신앙 생활 안에서의 갈등이나 하느님과의 관계에서 위로가 필요할 때" },
  { icon: "💧", title: "깊은 내면의 상처를 안고 계신 분", desc: "용서와 화해가 어렵고, 마음의 응어리가 풀리지 않을 때" },
  { icon: "🌿", title: "삶의 십자가가 무겁게 느껴지는 분", desc: "고통의 의미를 찾고 다시 일어설 영적 에너지가 필요할 때" },
  { icon: "🌸", title: "평화를 찾고 싶은 분", desc: "가톨릭의 정적이고 따뜻한 분위기 속에서 치유받고 싶을 때" },
];

const STEPS = [
  { num: "01", title: "판단 없는 경청", desc: "주님께서 우리를 사랑하시듯, 당신의 모든 이야기를 편견 없이 듣고 보듬습니다." },
  { num: "02", title: "영적 동반과 치유", desc: "기도의 마음으로 상담에 임하며, 당신의 내면이 하느님의 사랑 안에서 회복되도록 돕습니다." },
  { num: "03", title: "내면의 평화 찾기", desc: "일상의 소음에서 벗어나 침묵 속에서 나를 만나고, 진정한 자아를 찾는 시간을 갖습니다." },
];

export default function HealingPage() {
  return (
    <>
      <style>{`
        @keyframes gentleFade {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes softPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .heal-fade { animation: gentleFade 0.6s ease-out both; }
        .heal-card {
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .heal-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.06);
        }
      `}</style>

      <main style={{ backgroundColor: "#FBF9F7", minHeight: "100vh" }}>

        {/* ── Hero ── */}
        <section style={{
          background: "linear-gradient(180deg, #F5EDE4 0%, #FBF9F7 100%)",
          paddingTop: "clamp(100px, 14vw, 160px)",
          paddingBottom: "clamp(48px, 8vw, 80px)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
          {/* 부드러운 원형 배경 */}
          <div style={{
            position: "absolute",
            top: "-20%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(232,200,160,0.2) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div className="sacred-rail" style={{ position: "relative" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "#C9A96E",
              letterSpacing: "0.2em",
              marginBottom: "24px",
              animation: "softPulse 3s ease-in-out infinite",
            }}>
              HEALING
            </p>

            <h1 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(24px, 4vw, 40px)",
              fontWeight: 900,
              color: "#3D3528",
              letterSpacing: "-0.02em",
              lineHeight: 1.4,
              marginBottom: "24px",
            }}>
              주님 안에서,<br />
              당신의 마음이<br />
              <span style={{ color: "#C9A96E" }}>쉼을 얻기를.</span>
            </h1>

            <p style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              color: "#8A7E6B",
              lineHeight: 1.8,
              fontWeight: 300,
              fontStyle: "italic",
              marginBottom: "32px",
            }}>
              &ldquo;수고하고 짐 진 자들아 다 내게로 오너라&rdquo;<br />
              <span style={{ fontSize: "12px", color: "#B0A898" }}>마태 11,28</span>
            </p>

            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "clamp(13px, 1.5vw, 15px)",
              color: "#6B6358",
              lineHeight: 2,
              maxWidth: "440px",
              margin: "0 auto",
              fontWeight: 300,
            }}>
              세상의 소란함 속에 마음을 다치셨나요?<br />
              가톨릭 신앙의 온기를 담아<br />
              당신의 곁을 지키겠습니다.
            </p>
          </div>
        </section>

        {/* ── 이런 분과 함께하고 싶습니다 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "#C9A96E",
              letterSpacing: "0.15em",
              marginBottom: "12px",
            }}>
              FOR YOU
            </p>
            <h2 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(20px, 2.8vw, 26px)",
              fontWeight: 700,
              color: "#3D3528",
            }}>
              이런 마음의 여정을 함께하고 싶습니다
            </h2>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "16px",
            maxWidth: "900px",
            margin: "0 auto",
          }}>
            {JOURNEYS.map((j, i) => (
              <div
                key={i}
                className="heal-card heal-fade"
                style={{
                  animationDelay: `${i * 0.08}s`,
                  backgroundColor: "#FFFFFF",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  border: "1px solid #F0EBE3",
                }}
              >
                <span style={{ fontSize: "28px", display: "block", marginBottom: "14px" }}>
                  {j.icon}
                </span>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#3D3528",
                  marginBottom: "8px",
                  lineHeight: 1.5,
                }}>
                  {j.title}
                </p>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "13px",
                  color: "#8A7E6B",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}>
                  {j.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 진행 과정 ── */}
        <section style={{
          background: "linear-gradient(180deg, #F5EDE4 0%, #FBF9F7 100%)",
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <div className="sacred-rail">
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "10px",
                color: "#C9A96E",
                letterSpacing: "0.15em",
                marginBottom: "12px",
              }}>
                PROCESS
              </p>
              <h2 style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "clamp(20px, 2.8vw, 26px)",
                fontWeight: 700,
                color: "#3D3528",
              }}>
                마음치유는 이렇게 진행됩니다
              </h2>
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "#8A7E6B",
                fontWeight: 300,
                marginTop: "8px",
              }}>
                심리학적 전문성과 신앙의 지혜가 함께합니다
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "20px",
              maxWidth: "840px",
              margin: "0 auto",
            }}>
              {STEPS.map((s, i) => (
                <div
                  key={i}
                  className="heal-fade"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    backgroundColor: "#FFFFFF",
                    borderRadius: "16px",
                    padding: "32px 24px",
                    border: "1px solid #F0EBE3",
                    textAlign: "center",
                  }}
                >
                  <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "28px",
                    fontWeight: 500,
                    color: "#E8D5A8",
                    marginBottom: "16px",
                    lineHeight: 1,
                  }}>
                    {s.num}
                  </p>
                  <p style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "16px",
                    fontWeight: 600,
                    color: "#3D3528",
                    marginBottom: "10px",
                  }}>
                    {s.title}
                  </p>
                  <p style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "13px",
                    color: "#8A7E6B",
                    lineHeight: 1.8,
                    fontWeight: 300,
                  }}>
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 상담 참여 안내 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <div style={{
            maxWidth: "600px",
            margin: "0 auto",
            backgroundColor: "#FFFFFF",
            borderRadius: "20px",
            padding: "clamp(28px, 5vw, 48px)",
            border: "1px solid #F0EBE3",
            textAlign: "center",
          }}>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "#C9A96E",
              letterSpacing: "0.15em",
              marginBottom: "16px",
            }}>
              CONTACT
            </p>

            <h2 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(18px, 2.5vw, 24px)",
              fontWeight: 700,
              color: "#3D3528",
              marginBottom: "24px",
              lineHeight: 1.4,
            }}>
              상담 참여 안내
            </h2>

            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              marginBottom: "32px",
              textAlign: "left",
            }}>
              {[
                { label: "상담 방식", value: "1:1 대면 상담 / 화상 상담" },
                { label: "진행 과정", value: "사전 문의 → 마음 열기 → 심화 치유 → 평화의 마침" },
                { label: "상시 예약", value: "카카오 채널을 통해 문의해 주세요" },
              ].map((item, i) => (
                <div key={i} style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "baseline",
                  padding: "12px 16px",
                  backgroundColor: "#FBF9F7",
                  borderRadius: "10px",
                }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "10px",
                    color: "#C9A96E",
                    letterSpacing: "0.08em",
                    flexShrink: 0,
                    minWidth: "72px",
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "13px",
                    color: "#6B6358",
                    fontWeight: 300,
                    lineHeight: 1.6,
                  }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            {/* CTA 버튼 */}
            <a
              href="https://pf.kakao.com/_TyTZX/friend"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "14px",
                fontWeight: 600,
                color: "#FFFFFF",
                backgroundColor: "#3D3528",
                padding: "14px 32px",
                borderRadius: "12px",
                textDecoration: "none",
                marginBottom: "20px",
              }}
            >
              상담 문의하기
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7,7 17,7 17,17" />
              </svg>
            </a>

            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "11px",
              color: "#B0A898",
              fontWeight: 300,
              lineHeight: 1.6,
            }}>
              당신을 위한 기도를 시작하며 기다리겠습니다
            </p>
          </div>
        </section>

        {/* ── 마무리 인용구 ── */}
        <section style={{
          paddingTop: "clamp(32px, 5vw, 56px)",
          paddingBottom: "clamp(32px, 5vw, 56px)",
          textAlign: "center",
        }}>
          <div className="sacred-rail">
            <div style={{
              maxWidth: "480px",
              margin: "0 auto",
              padding: "32px 24px",
              borderTop: "1px solid #F0EBE3",
              borderBottom: "1px solid #F0EBE3",
            }}>
              <p style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "clamp(14px, 1.8vw, 17px)",
                color: "#8A7E6B",
                lineHeight: 1.9,
                fontStyle: "italic",
                fontWeight: 300,
              }}>
                &ldquo;두려워하지 마라,<br />
                내가 너와 함께 있다.&rdquo;
              </p>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                color: "#C9A96E",
                marginTop: "12px",
                letterSpacing: "0.05em",
              }}>
                이사 41,10
              </p>
            </div>

            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "13px",
              color: "#8A7E6B",
              fontWeight: 300,
              marginTop: "28px",
              lineHeight: 1.8,
            }}>
              촛불 하나가 어둠을 밝히듯,<br />
              당신의 마음속에도 희망의 불꽃이 피어오를 것입니다.
            </p>
          </div>
        </section>

        {/* ── 하단 네비 ── */}
        <div className="sacred-rail" style={{ paddingBottom: "40px" }}>
          <div style={{
            borderTop: "1px solid #F0EBE3",
            paddingTop: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <Link
              href="/"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "#B0A898",
                textDecoration: "none",
                fontWeight: 300,
              }}
            >
              &larr; 홈으로
            </Link>
            <Link
              href="/cooperator"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "#B0A898",
                textDecoration: "none",
                fontWeight: 300,
              }}
            >
              Cooperator &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
