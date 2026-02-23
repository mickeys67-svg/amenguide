import { motion } from "framer-motion";

interface StatsSectionProps {
    eventCount?: number;
}

export function StatsSection({ eventCount }: StatsSectionProps) {
    const STATS = [
        { number: eventCount != null ? eventCount.toLocaleString() : "—", label: "등록된 행사", sub: "실시간 업데이트" },
        { number: "247", label: "전국 피정의 집", sub: "직접 연결" },
        { number: "63", label: "참여 교구 및 단체", sub: "전국 네트워크" },
        { number: "∞", label: "하느님의 은혜", sub: "언제나 흘러넘치는" },
    ];
    return (
        <section
            className="py-24 md:py-36 relative overflow-hidden"
            style={{ backgroundColor: "#0A0906" }}
        >
            {/* Decorative large text */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
                style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "clamp(120px, 20vw, 280px)",
                    fontWeight: 900,
                    color: "rgba(201, 169, 110, 0.03)",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.05em",
                }}
            >
                CATHOLICA
            </div>

            <div className="sacred-rail relative z-10">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-12 flex items-center gap-4"
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
                        Numbers
                    </span>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
                    {STATS.map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.7, delay: i * 0.1 }}
                            className="flex flex-col justify-center py-10 md:py-14 px-4 md:px-12"
                            style={{ backgroundColor: "#0A0906" }}
                        >
                            <div
                                style={{
                                    fontFamily: "'Playfair Display', serif",
                                    color: "#C9A96E",
                                    fontSize: "clamp(28px, 5vw, 72px)",
                                    fontWeight: 700,
                                    lineHeight: 1,
                                    letterSpacing: "-0.03em",
                                    marginBottom: "30px",
                                }}
                            >
                                {stat.number}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Noto Serif KR', serif",
                                    color: "#F5F0E8",
                                    fontSize: "clamp(12px, 1.5vw, 15px)",
                                    fontWeight: 600,
                                    marginBottom: "12px",
                                }}
                            >
                                {stat.label}
                            </div>
                            <div
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    color: "rgba(245,240,232,0.3)",
                                    fontSize: "10px",
                                    letterSpacing: "0.05em",
                                }}
                            >
                                {stat.sub}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Quote */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-48 md:mt-64 text-center px-4"
                >
                    <p
                        style={{
                            fontFamily: "'Playfair Display', serif",
                            fontStyle: "italic",
                            color: "rgba(201, 169, 110, 0.5)",
                            fontSize: "clamp(14px, 2.5vw, 24px)",
                            lineHeight: 1.7,
                        }}
                    >
                        "Venite ad me omnes qui laboratis et onerati estis,
                        et ego reficiam vos."
                    </p>
                    <p
                        className="mt-10"
                        style={{
                            fontFamily: "'Noto Serif KR', serif",
                            color: "rgba(245,240,232,0.25)",
                            fontSize: "13px",
                        }}
                    >
                        수고하고 짐 진 사람은 모두 나에게 오너라. 내가 쉬게 해 주겠다. — 마태오 11,28
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
