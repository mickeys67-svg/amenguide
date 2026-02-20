import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

const LINKS = {
    카테고리: ["피정", "강의", "강론", "특강", "피정의 집"],
    정보: ["이용 안내", "행사 등록", "단체 파트너십", "공지사항", "자주 묻는 질문"],
    연결: ["카카오 채널", "뉴스레터 구독", "RSS 피드", "앱 다운로드"],
};

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="relative overflow-hidden"
            style={{ backgroundColor: "#050403", borderTop: "1px solid rgba(201,169,110,0.12)" }}
        >
            {/* Top section */}
            <div className="sacred-rail pt-20 pb-16">
                <div className="grid md:grid-cols-2 gap-10 md:gap-32 mb-24 md:mb-32">
                    {/* Brand */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-px w-10" style={{ backgroundColor: "#C9A96E" }} />
                                <span
                                    style={{
                                        fontFamily: "'Playfair Display', serif",
                                        color: "#C9A96E",
                                        fontSize: "10px",
                                        letterSpacing: "0.25em",
                                        textTransform: "uppercase",
                                    }}
                                >
                                    Catholica Hub
                                </span>
                            </div>
                            <h2
                                className="mb-6"
                                style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    color: "#F5F0E8",
                                    fontSize: "clamp(28px, 4vw, 48px)",
                                    fontWeight: 900,
                                    letterSpacing: "-0.03em",
                                    lineHeight: 1.15,
                                }}
                            >
                                가톨릭 행사<br />
                                <span style={{ color: "#C9A96E" }}>정보 허브</span>
                            </h2>
                            <p
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.35)",
                                    fontSize: "14px",
                                    lineHeight: 1.8,
                                    fontWeight: 300,
                                    maxWidth: "320px",
                                }}
                            >
                                전국의 피정, 강의, 강론, 특강 정보를 한곳에 모아 하느님의 부르심에 응답하는 여정을 돕습니다.
                            </p>
                        </motion.div>
                    </div>

                    {/* Newsletter */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                        className="flex flex-col justify-end"
                    >
                        <p
                            className="mb-12"
                            style={{
                                fontFamily: "'Noto Serif KR', serif",
                                color: "#F5F0E8",
                                fontSize: "18px",
                                fontWeight: 600,
                            }}
                        >
                            새로운 행사 소식 받기
                        </p>
                        <div
                            className="flex border-b border-[#C9A96E]/40"
                        >
                            <input
                                type="email"
                                placeholder="이메일 주소를 입력하세요"
                                className="flex-1 bg-transparent py-3 outline-none"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "#F5F0E8",
                                    fontSize: "14px",
                                    fontWeight: 300,
                                }}
                            />
                            <button
                                className="flex items-center gap-1 pl-4 transition-opacity hover:opacity-70 text-[#C9A96E]"
                            >
                                <span style={{ fontFamily: "'Noto Sans KR', sans-serif", fontSize: "12px", letterSpacing: "0.08em" }}>
                                    구독
                                </span>
                                <ArrowUpRight size={14} />
                            </button>
                        </div>
                        <p
                            className="mt-10"
                            style={{
                                fontFamily: "'Noto Sans KR', sans-serif",
                                color: "rgba(245,240,232,0.25)",
                                fontSize: "11px",
                            }}
                        >
                            매주 새로운 피정 및 행사 정보를 이메일로 받아보세요
                        </p>
                    </motion.div>
                </div>

                {/* Links grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-10 md:py-12" style={{ borderTop: "1px solid rgba(245,240,232,0.06)" }}>
                    {Object.entries(LINKS).map(([category, links], i) => (
                        <motion.div
                            key={category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: i * 0.1 }}
                        >
                            <p
                                className="mb-5"
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "#C9A96E",
                                    fontSize: "11px",
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                }}
                            >
                                {category}
                            </p>
                            <ul className="flex flex-col gap-3">
                                {links.map((link) => (
                                    <li key={link}>
                                        <a
                                            href="#"
                                            className="transition-all duration-200 group flex items-center gap-1 text-[rgba(245,240,232,0.4)] hover:text-[rgba(245,240,232,0.85)] font-light text-[13px]"
                                            style={{
                                                fontFamily: "'Noto Sans KR', sans-serif",
                                                textDecoration: "none",
                                            }}
                                        >
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom bar */}
                <div
                    className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pt-8"
                    style={{ borderTop: "1px solid rgba(245,240,232,0.06)" }}
                >
                    <p
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: "rgba(245,240,232,0.2)",
                            fontSize: "12px",
                        }}
                    >
                        © {currentYear} 가톨릭 행사 허브. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 flex-wrap">
                        {["개인정보처리방침", "이용약관", "사이트맵"].map((item) => (
                            <a
                                key={item}
                                href="#"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.2)",
                                    fontSize: "11px",
                                    textDecoration: "none",
                                }}
                            >
                                {item}
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Big background text */}
            <div
                className="absolute bottom-0 left-0 right-0 flex justify-center pointer-events-none select-none overflow-hidden"
                style={{ height: "120px" }}
            >
                <span
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "clamp(80px, 14vw, 200px)",
                        fontWeight: 900,
                        color: "rgba(201, 169, 110, 0.04)",
                        whiteSpace: "nowrap",
                        lineHeight: 1,
                        letterSpacing: "-0.05em",
                    }}
                >
                    PAX ET BONUM
                </span>
            </div>
        </footer>
    );
}
