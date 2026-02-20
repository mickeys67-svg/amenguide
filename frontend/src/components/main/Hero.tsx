import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

const HERO_IMAGE = "https://images.unsplash.com/photo-1762967027312-d39989e249b7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXRob2xpYyUyMGNodXJjaCUyMGludGVyaW9yJTIwZHJhbWF0aWMlMjBsaWdodHxlbnwxfHx8fDE3NzE1NTEwMDV8MA&ixlib=rb-4.1.0&q=80&w=1080";

interface HeroProps {
    eventCount: number;
    onScrollDown: () => void;
}

export function Hero({ eventCount, onScrollDown }: HeroProps) {
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleMouse = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const rect = heroRef.current.getBoundingClientRect();
            setMousePos({
                x: (e.clientX - rect.left) / rect.width - 0.5,
                y: (e.clientY - rect.top) / rect.height - 0.5,
            });
        };
        window.addEventListener("mousemove", handleMouse);
        return () => window.removeEventListener("mousemove", handleMouse);
    }, []);

    return (
        <section
            ref={heroRef}
            className="relative min-h-screen flex flex-col overflow-hidden"
            style={{ backgroundColor: "#080705" }}
        >
            {/* Background image with parallax */}
            <motion.div
                className="absolute inset-0"
                style={{
                    x: mousePos.x * -15,
                    y: mousePos.y * -10,
                    scale: 1.08,
                }}
                transition={{ type: "spring", stiffness: 40, damping: 20 }}
            >
                <img
                    src={HERO_IMAGE}
                    alt="가톨릭 성당"
                    className="w-full h-full object-cover"
                    style={{ opacity: 0.25 }}
                />
            </motion.div>

            {/* Gradient overlay */}
            <div
                className="absolute inset-0"
                style={{
                    background:
                        "linear-gradient(to bottom, rgba(8,7,5,0.3) 0%, rgba(8,7,5,0.1) 40%, rgba(8,7,5,0.8) 85%, rgba(8,7,5,1) 100%)",
                }}
            />

            {/* Gold horizontal line - top */}
            <motion.div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ backgroundColor: "#C9A96E", transformOrigin: "left" }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.5, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            />

            {/* Main content */}
            <div className="sacred-rail relative z-10 flex flex-col justify-center flex-1 pt-32 pb-24">
                {/* Year tag */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="w-full flex items-center gap-3 mb-32"
                >
                    <div className="h-px w-12" style={{ backgroundColor: "#C9A96E" }} />
                    <span
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            color: "#C9A96E",
                            fontSize: "11px",
                            letterSpacing: "0.25em",
                            textTransform: "uppercase",
                        }}
                    >
                        2026 가톨릭 행사 정보
                    </span>
                </motion.div>

                {/* Main headline */}
                <div className="overflow-hidden mb-12">
                    <motion.h1
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "#F5F0E8",
                            fontSize: "clamp(52px, 9vw, 130px)",
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        은혜의
                    </motion.h1>
                </div>
                <div className="overflow-hidden mb-16">
                    <motion.h1
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 1, delay: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "#C9A96E",
                            fontSize: "clamp(52px, 9vw, 130px)",
                            fontWeight: 900,
                            lineHeight: 1,
                            letterSpacing: "-0.04em",
                        }}
                    >
                        시간들
                    </motion.h1>
                </div>

                {/* Subtitle row */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.9 }}
                    className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 mt-8"
                >
                    <p
                        className="max-w-md"
                        style={{
                            fontFamily: "'Noto Sans KR', sans-serif",
                            color: "rgba(245, 240, 232, 0.55)",
                            fontSize: "14px",
                            lineHeight: 1.8,
                            fontWeight: 300,
                        }}
                    >
                        전국의 피정, 강의, 강론, 특강을 한곳에서.<br />
                        하느님의 부르심에 응답하는 여정을 함께합니다.
                    </p>

                    <div className="flex items-end gap-8 md:gap-12">
                        <div>
                            <div
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "#C9A96E",
                                    fontSize: "clamp(32px, 5vw, 64px)",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                }}
                            >
                                {eventCount}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245, 240, 232, 0.4)",
                                    fontSize: "10px",
                                    letterSpacing: "0.12em",
                                    marginTop: "4px",
                                }}
                            >
                                예정 행사
                            </div>
                        </div>
                        <div>
                            <div
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "#F5F0E8",
                                    fontSize: "clamp(32px, 5vw, 64px)",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                }}
                            >
                                5
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245, 240, 232, 0.4)",
                                    fontSize: "10px",
                                    letterSpacing: "0.12em",
                                    marginTop: "4px",
                                }}
                            >
                                카테고리
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.button
                onClick={onScrollDown}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4, duration: 0.8 }}
                whileHover={{ y: 4 }}
            >
                <span
                    style={{
                        fontFamily: "'Playfair Display', serif",
                        color: "rgba(201, 169, 110, 0.6)",
                        fontSize: "10px",
                        letterSpacing: "0.2em",
                    }}
                >
                    SCROLL
                </span>
                <motion.div
                    animate={{ y: [0, 6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                >
                    <ChevronDown size={16} style={{ color: "#C9A96E" }} />
                </motion.div>
            </motion.button>

            {/* Bottom right — decorative text */}
            <motion.div
                className="absolute bottom-10 right-8 md:right-16 hidden md:block"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{
                    fontFamily: "'Playfair Display', serif",
                    color: "rgba(201, 169, 110, 0.25)",
                    fontSize: "10px",
                    letterSpacing: "0.3em",
                    writingMode: "vertical-rl",
                    textTransform: "uppercase",
                }}
            >
                Pax et Bonum
            </motion.div>
        </section>
    );
}
