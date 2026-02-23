import Link from "next/link";

export default function NotFound() {
    return (
        <main
            className="min-h-screen flex flex-col items-center justify-center px-4"
            style={{ backgroundColor: "#080705" }}
        >
            <p
                style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "rgba(201,169,110,0.4)",
                    fontSize: "clamp(80px, 15vw, 180px)",
                    fontWeight: 900,
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                }}
            >
                404
            </p>
            <h1
                className="mt-6 mb-3 text-center"
                style={{
                    fontFamily: "'Noto Serif KR', serif",
                    color: "#F5F0E8",
                    fontSize: "clamp(20px, 3vw, 32px)",
                    fontWeight: 700,
                }}
            >
                페이지를 찾을 수 없습니다
            </h1>
            <p
                className="mb-12 text-center"
                style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    color: "rgba(245,240,232,0.35)",
                    fontSize: "15px",
                    lineHeight: 1.8,
                }}
            >
                요청하신 페이지가 존재하지 않거나 이동되었습니다.
            </p>
            <Link
                href="/"
                style={{
                    fontFamily: "'Noto Sans KR', sans-serif",
                    color: "#C9A96E",
                    fontSize: "14px",
                    borderBottom: "1px solid #C9A96E",
                    paddingBottom: "2px",
                }}
            >
                홈으로 돌아가기
            </Link>
        </main>
    );
}
