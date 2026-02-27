"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("로그인 처리 중...");

    useEffect(() => {
        const token = searchParams.get("token");
        const userStr = searchParams.get("user");
        const error = searchParams.get("error");

        if (error) {
            const msg =
                error === "cancelled"
                    ? "로그인이 취소되었습니다."
                    : "로그인 중 오류가 발생했습니다.";
            setStatus("error");
            setMessage(msg);
            setTimeout(() => router.push("/login"), 2500);
            return;
        }

        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                localStorage.setItem("authToken", token);
                localStorage.setItem("authUser", JSON.stringify(user));
                setStatus("success");
                setMessage(`환영합니다, ${user.name || user.email}!`);
                // window.location.href 로 전체 새로고침 → Navigation이 localStorage 재읽음
                setTimeout(() => { window.location.href = "/"; }, 1200);
            } catch {
                setStatus("error");
                setMessage("인증 정보 처리에 실패했습니다.");
                setTimeout(() => { window.location.href = "/login"; }, 2500);
            }
        } else {
            setStatus("error");
            setMessage("잘못된 요청입니다.");
            setTimeout(() => { window.location.href = "/login"; }, 2500);
        }
    }, [searchParams, router]);

    return (
        <>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .cb-wrap {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: #F8F7F4;
                    animation: fadeIn 0.4s ease;
                }
            `}</style>
            <div className="cb-wrap">
                <div style={{ textAlign: "center", padding: "0 24px" }}>

                    {/* 아이콘 */}
                    {status === "loading" && (
                        <div style={{
                            width: 52, height: 52,
                            border: "3px solid #E8E5DF",
                            borderTop: "3px solid #0B2040",
                            borderRadius: "50%",
                            animation: "spin 0.8s linear infinite",
                            margin: "0 auto 28px",
                        }} />
                    )}
                    {status === "success" && (
                        <div style={{
                            width: 52, height: 52,
                            borderRadius: "50%",
                            backgroundColor: "#0B2040",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 28px",
                        }}>
                            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                    )}
                    {status === "error" && (
                        <div style={{
                            width: 52, height: 52,
                            borderRadius: "50%",
                            backgroundColor: "#FEF2F2",
                            border: "2px solid #FECACA",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            margin: "0 auto 28px",
                        }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </div>
                    )}

                    {/* 메시지 */}
                    <p style={{
                        fontFamily: "'Noto Serif KR', serif",
                        fontWeight: 700,
                        fontSize: "18px",
                        color: "#100F0F",
                        marginBottom: "8px",
                        letterSpacing: "-0.02em",
                    }}>
                        {status === "success" ? "로그인 성공" : status === "error" ? "로그인 실패" : "잠시만요"}
                    </p>
                    <p style={{
                        fontFamily: "'Noto Sans KR', sans-serif",
                        fontSize: "14px",
                        color: "#9C9891",
                        fontWeight: 300,
                    }}>
                        {message}
                    </p>

                    {/* 진행 바 (성공/에러 시) */}
                    {status !== "loading" && (
                        <div style={{
                            width: 200,
                            height: 2,
                            backgroundColor: "#E8E5DF",
                            borderRadius: 2,
                            margin: "24px auto 0",
                            overflow: "hidden",
                        }}>
                            <div style={{
                                width: "100%",
                                height: "100%",
                                backgroundColor: status === "success" ? "#0B2040" : "#DC2626",
                                animation: `progressBar ${status === "success" ? 1.2 : 2.5}s linear forwards`,
                            }} />
                        </div>
                    )}
                </div>

                <style>{`
                    @keyframes progressBar {
                        from { transform: translateX(-100%); }
                        to { transform: translateX(0%); }
                    }
                `}</style>
            </div>
        </>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#F8F7F4" }}>
                <div style={{ width: 48, height: 48, border: "3px solid #E8E5DF", borderTop: "3px solid #0B2040", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        }>
            <CallbackInner />
        </Suspense>
    );
}
