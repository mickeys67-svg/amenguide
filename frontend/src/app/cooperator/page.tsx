import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = "https://catholica.kr";

export const metadata: Metadata = {
  title: "Cooperatores Christi | Catholica",
  description: "Catholica 서비스를 함께 세워가는 분들께 감사드립니다. 기부자 감사 페이지.",
  alternates: { canonical: `${SITE_URL}/cooperator` },
  openGraph: {
    title: "Cooperatores Christi — 그리스도의 협력자",
    description: "Catholica 서비스를 함께 세워가는 분들께 감사드립니다.",
    url: `${SITE_URL}/cooperator`,
    siteName: "Catholica",
    locale: "ko_KR",
    type: "website",
  },
};

/* ── 기부자 데이터 (추후 DB 연동 가능) ── */
interface Donor {
  name: string;
  since?: string; // 가입 시기
  message?: string; // 한마디
}

const AURUM_DONORS: (Donor | null)[] = [
  // 12칸 — 빈 슬롯은 null
  null, null, null, null,
  null, null, null, null,
  null, null, null, null,
];

const ARGENTUM_DONORS: (Donor | null)[] = Array.from({ length: 40 }, () => null);

const AES_DONORS: Donor[] = [];

/* ── 컴포넌트 ── */
export default function CooperatorPage() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatGlow {
          0%, 100% { opacity: 0.3; transform: translateY(0px); }
          50% { opacity: 0.6; transform: translateY(-8px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .cooperator-shimmer {
          background: linear-gradient(90deg, transparent 0%, rgba(201,169,110,0.15) 50%, transparent 100%);
          background-size: 200% 100%;
          animation: shimmer 3s ease-in-out infinite;
        }
        .cooperator-card-aurum {
          animation: fadeInUp 0.6s ease-out both;
        }
        .cooperator-card-argentum {
          animation: fadeInUp 0.6s ease-out both;
        }
        .cooperator-card-aes {
          animation: fadeInUp 0.6s ease-out both;
        }
      `}</style>

      <main style={{ backgroundColor: "#0B2040", minHeight: "100vh" }}>

        {/* ── Hero Section ── */}
        <section style={{
          position: "relative",
          overflow: "hidden",
          paddingTop: "clamp(100px, 15vw, 160px)",
          paddingBottom: "clamp(60px, 10vw, 100px)",
          textAlign: "center",
        }}>
          {/* 배경 아치 패턴 */}
          <div style={{
            position: "absolute",
            inset: 0,
            opacity: 0.06,
            backgroundImage: `repeating-conic-gradient(from 0deg at 50% 0%, transparent 0deg, transparent 170deg, #C9A96E 170deg, #C9A96E 190deg, transparent 190deg)`,
            backgroundSize: "120px 200px",
            backgroundPosition: "center top",
          }} />

          {/* 십자가 SVG */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "32px",
            animation: "floatGlow 4s ease-in-out infinite",
          }}>
            <svg width="48" height="64" viewBox="0 0 48 64" fill="none">
              <rect x="20" y="0" width="8" height="64" rx="4" fill="#C9A96E" />
              <rect x="4" y="14" width="40" height="8" rx="4" fill="#C9A96E" />
              <circle cx="24" cy="18" r="6" fill="none" stroke="#C9A96E" strokeWidth="1.5" opacity="0.5" />
            </svg>
          </div>

          {/* 타이틀 */}
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C9A96E",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}>
            Cooperatores Christi
          </p>

          <h1 style={{
            fontFamily: "'Noto Serif KR', serif",
            fontSize: "clamp(28px, 4.5vw, 48px)",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: "20px",
          }}>
            그리스도의<br />
            <span style={{
              background: "linear-gradient(135deg, #C9A96E 0%, #E8D5A8 50%, #C9A96E 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              animation: "shimmer 3s ease-in-out infinite",
            }}>
              협력자
            </span>
          </h1>

          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.8,
            maxWidth: "480px",
            margin: "0 auto",
            fontWeight: 300,
            padding: "0 20px",
          }}>
            이 서비스는 여러분의 정성으로 운영됩니다.<br />
            전국의 가톨릭 행사를 한곳에 모으는 이 여정에<br />
            함께해 주신 분들께 깊은 감사를 드립니다.
          </p>
        </section>

        {/* ── AURUM (금잔) — 12명 ── */}
        <section className="sacred-rail" style={{ paddingBottom: "clamp(48px, 8vw, 80px)" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, #C9A96E)" }} />
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.2em",
                background: "linear-gradient(135deg, #C9A96E, #E8D5A8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                AURUM
              </p>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, #C9A96E, transparent)" }} />
            </div>

            <h2 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(22px, 3vw, 30px)",
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: "8px",
            }}>
              금잔
            </h2>
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.4)",
              fontWeight: 300,
            }}>
              1년 서버 운영비 후원 &middot; 12명 한정
            </p>
          </div>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
            maxWidth: "960px",
            margin: "0 auto",
          }}>
            {AURUM_DONORS.map((donor, i) => (
              <div
                key={`aurum-${i}`}
                className="cooperator-card-aurum"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  position: "relative",
                  borderRadius: "16px",
                  padding: "28px 24px",
                  minHeight: "140px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  background: donor
                    ? "linear-gradient(135deg, rgba(201,169,110,0.12) 0%, rgba(232,213,168,0.06) 100%)"
                    : "rgba(255,255,255,0.02)",
                  border: donor
                    ? "1px solid rgba(201,169,110,0.35)"
                    : "1px dashed rgba(201,169,110,0.15)",
                  backdropFilter: "blur(8px)",
                  transition: "border-color 0.3s, transform 0.3s",
                  overflow: "hidden",
                }}
              >
                {donor ? (
                  <>
                    <div className="cooperator-shimmer" style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "16px",
                      pointerEvents: "none",
                    }} />
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: "#C9A96E",
                      letterSpacing: "0.15em",
                      marginBottom: "12px",
                      position: "relative",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p style={{
                      fontFamily: "'Noto Serif KR', serif",
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#FFFFFF",
                      marginBottom: "8px",
                      position: "relative",
                    }}>
                      {donor.name}
                    </p>
                    {donor.since && (
                      <p style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        color: "rgba(201,169,110,0.6)",
                        position: "relative",
                      }}>
                        since {donor.since}
                      </p>
                    )}
                    {donor.message && (
                      <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.5)",
                        marginTop: "10px",
                        textAlign: "center",
                        lineHeight: 1.6,
                        fontWeight: 300,
                        position: "relative",
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
                      color: "rgba(201,169,110,0.25)",
                      letterSpacing: "0.15em",
                      marginBottom: "10px",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                    <p style={{
                      fontFamily: "'Noto Sans KR', sans-serif",
                      fontSize: "12px",
                      color: "rgba(201,169,110,0.2)",
                      fontWeight: 300,
                      fontStyle: "italic",
                    }}>
                      당신의 자리
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── ARGENTUM (은잔) — 40명 ── */}
        <section style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.04) 100%)",
          paddingTop: "clamp(48px, 8vw, 80px)",
          paddingBottom: "clamp(48px, 8vw, 80px)",
        }}>
          <div className="sacred-rail">
            <div style={{ textAlign: "center", marginBottom: "40px" }}>
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
              }}>
                <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, #B8B8B8)" }} />
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  letterSpacing: "0.2em",
                  background: "linear-gradient(135deg, #B8B8B8, #E0E0E0)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}>
                  ARGENTUM
                </p>
                <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, #B8B8B8, transparent)" }} />
              </div>

              <h2 style={{
                fontFamily: "'Noto Serif KR', serif",
                fontSize: "clamp(20px, 2.8vw, 26px)",
                fontWeight: 700,
                color: "#FFFFFF",
                marginBottom: "8px",
              }}>
                은잔
              </h2>
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "13px",
                color: "rgba(255,255,255,0.35)",
                fontWeight: 300,
              }}>
                6개월 서버 운영비 후원 &middot; 40명 한정
              </p>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "10px",
              maxWidth: "1100px",
              margin: "0 auto",
            }}>
              {ARGENTUM_DONORS.map((donor, i) => (
                <div
                  key={`argentum-${i}`}
                  className="cooperator-card-argentum"
                  style={{
                    animationDelay: `${i * 0.02}s`,
                    borderRadius: "12px",
                    padding: "18px 16px",
                    minHeight: "90px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    background: donor
                      ? "linear-gradient(135deg, rgba(184,184,184,0.1) 0%, rgba(224,224,224,0.05) 100%)"
                      : "rgba(255,255,255,0.015)",
                    border: donor
                      ? "1px solid rgba(184,184,184,0.25)"
                      : "1px dashed rgba(184,184,184,0.08)",
                    transition: "border-color 0.3s",
                  }}
                >
                  {donor ? (
                    <>
                      <p style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#FFFFFF",
                        marginBottom: "4px",
                      }}>
                        {donor.name}
                      </p>
                      {donor.since && (
                        <p style={{
                          fontFamily: "'DM Mono', monospace",
                          fontSize: "9px",
                          color: "rgba(184,184,184,0.5)",
                        }}>
                          since {donor.since}
                        </p>
                      )}
                    </>
                  ) : (
                    <p style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "9px",
                      color: "rgba(184,184,184,0.15)",
                      letterSpacing: "0.1em",
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AES (동잔) — 무제한 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 8vw, 80px)",
          paddingBottom: "clamp(48px, 8vw, 80px)",
        }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "16px",
            }}>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, transparent, #CD7F32)" }} />
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                letterSpacing: "0.2em",
                background: "linear-gradient(135deg, #CD7F32, #DBA06B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                AES
              </p>
              <div style={{ width: "40px", height: "1px", background: "linear-gradient(90deg, #CD7F32, transparent)" }} />
            </div>

            <h2 style={{
              fontFamily: "'Noto Serif KR', serif",
              fontSize: "clamp(20px, 2.8vw, 26px)",
              fontWeight: 700,
              color: "#FFFFFF",
              marginBottom: "8px",
            }}>
              동잔
            </h2>
            <p style={{
              fontFamily: "'Noto Sans KR', sans-serif",
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              fontWeight: 300,
            }}>
              1개월 서버 운영비 후원 &middot; 인원 제한 없음
            </p>
          </div>

          {AES_DONORS.length > 0 ? (
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px",
              maxWidth: "800px",
              margin: "0 auto",
            }}>
              {AES_DONORS.map((donor, i) => (
                <span
                  key={`aes-${i}`}
                  className="cooperator-card-aes"
                  style={{
                    animationDelay: `${i * 0.03}s`,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontSize: "13px",
                    fontWeight: 400,
                    color: "#FFFFFF",
                    padding: "8px 18px",
                    borderRadius: "20px",
                    background: "linear-gradient(135deg, rgba(205,127,50,0.1) 0%, rgba(219,160,107,0.05) 100%)",
                    border: "1px solid rgba(205,127,50,0.2)",
                  }}
                >
                  {donor.name}
                </span>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "40px",
              borderRadius: "16px",
              border: "1px dashed rgba(205,127,50,0.15)",
              maxWidth: "500px",
              margin: "0 auto",
            }}>
              <p style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: "14px",
                color: "rgba(205,127,50,0.3)",
                fontWeight: 300,
                fontStyle: "italic",
              }}>
                첫 번째 동잔 협력자를 기다리고 있습니다
              </p>
            </div>
          )}
        </section>

        {/* ── 구분선 ── */}
        <div className="sacred-rail">
          <div style={{
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(201,169,110,0.2), transparent)",
          }} />
        </div>

        {/* ── CTA 참여 안내 ── */}
        <section className="sacred-rail" style={{
          paddingTop: "clamp(48px, 8vw, 80px)",
          paddingBottom: "clamp(60px, 10vw, 100px)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            color: "#C9A96E",
            letterSpacing: "0.2em",
            marginBottom: "20px",
          }}>
            BECOME A COOPERATOR
          </p>

          <h2 style={{
            fontFamily: "'Noto Serif KR', serif",
            fontSize: "clamp(22px, 3.5vw, 32px)",
            fontWeight: 700,
            color: "#FFFFFF",
            marginBottom: "20px",
            lineHeight: 1.4,
          }}>
            이 여정에 함께하세요
          </h2>

          <p style={{
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: "clamp(13px, 1.6vw, 15px)",
            color: "rgba(255,255,255,0.45)",
            lineHeight: 1.9,
            maxWidth: "440px",
            margin: "0 auto 40px",
            fontWeight: 300,
          }}>
            Catholica는 비영리로 운영되며,<br />
            서버 운영비 전액이 서비스 유지에 사용됩니다.<br />
            후원을 원하시는 분은 아래로 연락해 주세요.
          </p>

          {/* 티어 안내 카드 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            maxWidth: "720px",
            margin: "0 auto 48px",
          }}>
            {[
              { tier: "AURUM", label: "금잔", desc: "1년 서버 운영비", limit: "12명 한정", color: "#C9A96E" },
              { tier: "ARGENTUM", label: "은잔", desc: "6개월 서버 운영비", limit: "40명 한정", color: "#B8B8B8" },
              { tier: "AES", label: "동잔", desc: "1개월 서버 운영비", limit: "인원 무제한", color: "#CD7F32" },
            ].map((t) => (
              <div key={t.tier} style={{
                borderRadius: "12px",
                padding: "24px 20px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${t.color}22`,
              }}>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.15em",
                  color: t.color,
                  marginBottom: "8px",
                }}>
                  {t.tier}
                </p>
                <p style={{
                  fontFamily: "'Noto Serif KR', serif",
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  marginBottom: "6px",
                }}>
                  {t.label}
                </p>
                <p style={{
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.4)",
                  fontWeight: 300,
                  marginBottom: "4px",
                }}>
                  {t.desc}
                </p>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                  color: `${t.color}88`,
                }}>
                  {t.limit}
                </p>
              </div>
            ))}
          </div>

          {/* 연락처 */}
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
              color: "#0B2040",
              backgroundColor: "#C9A96E",
              padding: "14px 32px",
              borderRadius: "8px",
              textDecoration: "none",
              transition: "opacity 0.2s",
            }}
          >
            카카오 채널로 문의하기
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="7" y1="17" x2="17" y2="7" />
              <polyline points="7,7 17,7 17,17" />
            </svg>
          </a>
        </section>

        {/* ── 하단 네비게이션 ── */}
        <div className="sacred-rail" style={{
          paddingBottom: "40px",
        }}>
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
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
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                fontWeight: 300,
              }}
            >
              &larr; 홈으로
            </Link>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.15)",
              letterSpacing: "0.1em",
            }}>
              Ad Maiorem Dei Gloriam
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
