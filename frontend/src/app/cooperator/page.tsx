import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  title: "Cooperator | Catholica",
  description: "Catholica를 함께 만들어가는 분들. 서버 운영비 후원자 감사 페이지.",
  alternates: { canonical: `${SITE_URL}/cooperator` },
  openGraph: {
    title: "Cooperator — 함께 만드는 사람들",
    description: "Catholica를 함께 만들어가는 분들께 감사드립니다.",
    url: `${SITE_URL}/cooperator`,
    siteName: "Catholica",
    locale: "ko_KR",
    type: "website",
  },
};

/* ── 기부자 데이터 (추후 DB 연동 가능) ── */
interface Donor {
  name: string;
  since?: string;
  message?: string;
}

const FOUNDING_DONORS: (Donor | null)[] = [
  { name: "장유리 세실리아", since: "2026", message: "함께 걸어가는 여정에 감사합니다" },
  { name: "윤희 마리아", since: "2026", message: "작은 정성이 큰 기쁨이 되길" },
  null, null, null, null,
  null, null, null, null,
  null, null,
];
const CORE_DONORS: (Donor | null)[] = Array.from({ length: 40 }, () => null);
const FRIEND_DONORS: Donor[] = [];

/* ── 티어 설정 ── */
const TIERS = [
  {
    key: "founding",
    label: "FOUNDING",
    title: "창립 멤버",
    desc: "1년 서버 운영비 후원",
    limit: "12명 한정",
    accent: "#C9A96E",
    accentLight: "rgba(201,169,110,0.08)",
    accentBorder: "rgba(201,169,110,0.25)",
    accentDim: "rgba(201,169,110,0.12)",
  },
  {
    key: "core",
    label: "CORE",
    title: "핵심 서포터",
    desc: "6개월 서버 운영비 후원",
    limit: "40명 한정",
    accent: "#0B2040",
    accentLight: "rgba(11,32,64,0.04)",
    accentBorder: "rgba(11,32,64,0.15)",
    accentDim: "rgba(11,32,64,0.08)",
  },
  {
    key: "friend",
    label: "FRIEND",
    title: "함께하는 친구",
    desc: "1개월 서버 운영비 후원",
    limit: "인원 제한 없음",
    accent: "#52504B",
    accentLight: "rgba(82,80,75,0.04)",
    accentBorder: "rgba(82,80,75,0.12)",
    accentDim: "rgba(82,80,75,0.06)",
  },
];

export default function CooperatorPage() {
  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmerGold {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .coop-fade { animation: fadeUp 0.5s ease-out both; }
        .coop-shimmer {
          background: linear-gradient(90deg, #C9A96E 0%, #E8D5A8 40%, #C9A96E 80%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerGold 4s ease-in-out infinite;
        }
        .coop-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .coop-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.06);
        }
      `}</style>

      <main style={{ backgroundColor: "#F8F7F4", minHeight: "100vh" }}>

        {/* ── Hero ── */}
        <section style={{
          paddingTop: "clamp(100px, 14vw, 160px)",
          paddingBottom: "clamp(48px, 8vw, 80px)",
          textAlign: "center",
        }}>
          <div className="sacred-rail">
            {/* 라벨 */}
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "#C9A96E",
              letterSpacing: "0.2em",
              marginBottom: "20px",
            }}>
              COOPERATOR
            </p>

            {/* 타이틀 */}
            <h1 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(26px, 4vw, 44px)",
              fontWeight: 900,
              color: "#0B2040",
              letterSpacing: "-0.02em",
              lineHeight: 1.3,
              marginBottom: "20px",
            }}>
              함께 만드는<br />
              <span className="coop-shimmer">사람들.</span>
            </h1>

            {/* 설명 */}
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "clamp(14px, 1.6vw, 16px)",
              color: "#52504B",
              lineHeight: 1.9,
              maxWidth: "420px",
              margin: "0 auto",
              fontWeight: 300,
            }}>
              Catholica는 비영리로 운영됩니다.<br />
              서버 운영비를 후원해 주신 분들께<br />
              진심으로 감사드립니다.
            </p>
          </div>
        </section>

        {/* ── 구분선 ── */}
        <div className="sacred-rail">
          <div style={{ height: "1px", background: "#E8E5DF" }} />
        </div>

        {/* ── FOUNDING — 12명 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <TierHeader tier={TIERS[0]} />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "14px",
            maxWidth: "1000px",
            margin: "0 auto",
          }}>
            {FOUNDING_DONORS.map((donor, i) => (
              <div
                key={`f-${i}`}
                className="coop-card coop-fade"
                style={{
                  animationDelay: `${i * 0.04}s`,
                  borderRadius: "12px",
                  padding: donor ? "28px 24px" : "24px",
                  minHeight: "120px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: donor ? "#FFFFFF" : "#F8F7F4",
                  border: donor
                    ? `1px solid ${TIERS[0].accentBorder}`
                    : "1px dashed #E8E5DF",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {donor ? (
                  <>
                    {/* 골드 탑 라인 */}
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: "20%",
                      right: "20%",
                      height: "2px",
                      background: `linear-gradient(90deg, transparent, ${TIERS[0].accent}, transparent)`,
                    }} />
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: TIERS[0].accent,
                      letterSpacing: "0.12em",
                      marginBottom: "10px",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontSize: "17px",
                      fontWeight: 700,
                      color: "#0B2040",
                      marginBottom: "6px",
                    }}>
                      {donor.name}
                    </p>
                    {donor.since && (
                      <p style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        color: "#9C9891",
                      }}>
                        since {donor.since}
                      </p>
                    )}
                    {donor.message && (
                      <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "12px",
                        color: "#52504B",
                        marginTop: "10px",
                        textAlign: "center",
                        lineHeight: 1.6,
                        fontWeight: 300,
                        fontStyle: "italic",
                      }}>
                        &ldquo;{donor.message}&rdquo;
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: "#D0CDC7",
                      letterSpacing: "0.12em",
                      marginBottom: "8px",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "12px",
                      color: "#D0CDC7",
                      fontWeight: 300,
                    }}>
                      자리가 비어 있습니다
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── CORE — 40명 ── */}
        <section style={{
          backgroundColor: "#FFFFFF",
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <div className="sacred-rail">
            <TierHeader tier={TIERS[1]} />

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "10px",
              maxWidth: "1100px",
              margin: "0 auto",
            }}>
              {CORE_DONORS.map((donor, i) => (
                <div
                  key={`c-${i}`}
                  className="coop-fade"
                  style={{
                    animationDelay: `${i * 0.015}s`,
                    borderRadius: "10px",
                    padding: "16px 12px",
                    minHeight: "72px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: donor ? "#F8F7F4" : "transparent",
                    border: donor
                      ? `1px solid ${TIERS[1].accentBorder}`
                      : "1px dashed #E8E5DF",
                    transition: "background-color 0.2s",
                  }}
                >
                  {donor ? (
                    <>
                      <p style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#0B2040",
                        marginBottom: "2px",
                      }}>
                        {donor.name}
                      </p>
                      {donor.since && (
                        <p style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "9px",
                          color: "#9C9891",
                        }}>
                          {donor.since}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "9px",
                      color: "#D0CDC7",
                      letterSpacing: "0.08em",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FRIEND — 무제한 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 7vw, 72px)",
          paddingBottom: "clamp(48px, 7vw, 72px)",
        }}>
          <TierHeader tier={TIERS[2]} />

          {FRIEND_DONORS.length > 0 ? (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px",
              maxWidth: "800px",
              margin: "0 auto",
            }}>
              {FRIEND_DONORS.map((donor, i) => (
                <span
                  key={`fr-${i}`}
                  className="coop-fade"
                  style={{
                    animationDelay: `${i * 0.03}s`,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#52504B",
                    padding: "8px 20px",
                    borderRadius: "24px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E8E5DF",
                  }}
                >
                  {donor.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "36px",
              borderRadius: "12px",
              border: "1px dashed #E8E5DF",
              maxWidth: "420px",
              margin: "0 auto",
            }}>
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "#D0CDC7",
                fontWeight: 300,
              }}>
                첫 번째 친구를 기다리고 있습니다
              </p>
            </div>
          )}
        </section>

        {/* ── 구분선 ── */}
        <div className="sacred-rail">
          <div style={{ height: "1px", background: "#E8E5DF" }} />
        </div>

        {/* ── CTA ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 8vw, 80px)",
          paddingBottom: "clamp(60px, 10vw, 100px)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C9A96E",
            letterSpacing: "0.18em",
            marginBottom: "20px",
          }}>
            JOIN US
          </p>

          <h2 style={{
            fontFamily: "'Noto Serif KR', serif",
            fontSize: "clamp(20px, 3vw, 28px)",
            fontWeight: 700,
            color: "#0B2040",
            marginBottom: "16px",
            lineHeight: 1.4,
          }}>
            함께해 주세요
          </h2>

          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "14px",
            color: "#52504B",
            lineHeight: 1.9,
            maxWidth: "380px",
            margin: "0 auto 36px",
            fontWeight: 300,
          }}>
            후원금 전액은 서버 운영에 사용됩니다.<br />
            참여를 원하시면 아래로 연락해 주세요.
          </p>

          {/* 티어 요약 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            maxWidth: "640px",
            margin: "0 auto 40px",
          }}>
            {TIERS.map((t) => (
              <div key={t.key} style={{
                borderRadius: "10px",
                padding: "20px 16px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E8E5DF",
              }}>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: t.accent,
                  marginBottom: "6px",
                }}>
                  {t.label}
                </p>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "14px",
                  fontWeight: 600,
                  color: "#0B2040",
                  marginBottom: "4px",
                }}>
                  {t.title}
                </p>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "12px",
                  color: "#9C9891",
                  fontWeight: 300,
                }}>
                  {t.desc}
                </p>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "9px",
                  color: "#D0CDC7",
                  marginTop: "6px",
                }}>
                  {t.limit}
                </p>
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
              backgroundColor: "#0B2040",
              padding: "14px 32px",
              borderRadius: "8px",
              textDecoration: "none",
            }}
          >
            카카오 채널로 문의하기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7,7 17,7 17,17" />
            </svg>
          </a>
        </section>

        {/* ── 하단 네비 ── */}
        <div className="sacred-rail" style={{ paddingBottom: "40px" }}>
          <div style={{
            borderTop: "1px solid #E8E5DF",
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
                color: "#9C9891",
                textDecoration: "none",
                fontWeight: 300,
              }}
            >
              &larr; 홈으로
            </Link>
            <Link
              href="/terms"
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "#9C9891",
                textDecoration: "none",
                fontWeight: 300,
              }}
            >
              이용약관 &rarr;
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

/* ── 티어 헤더 컴포넌트 ── */
function TierHeader({ tier }: { tier: typeof TIERS[number] }) {
  return (
    <div style={{ textAlign: "center", marginBottom: "36px" }}>
      <div style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "12px",
        marginBottom: "12px",
      }}>
        <div style={{ width: "32px", height: "1px", background: `linear-gradient(90deg, transparent, ${tier.accent})` }} />
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.18em",
          color: tier.accent,
        }}>
          {tier.label}
        </p>
        <div style={{ width: "32px", height: "1px", background: `linear-gradient(90deg, ${tier.accent}, transparent)` }} />
      </div>

      <h2 style={{
        fontFamily: "'Noto Serif KR', serif",
        fontSize: "clamp(20px, 2.8vw, 26px)",
        fontWeight: 700,
        color: "#0B2040",
        marginBottom: "6px",
      }}>
        {tier.title}
      </h2>
      <p style={{
        fontFamily: "'Noto Sans KR', sans-serif",
        fontSize: "13px",
        color: "#9C9891",
        fontWeight: 300,
      }}>
        {tier.desc} &middot; {tier.limit}
      </p>
    </div>
  );
}
