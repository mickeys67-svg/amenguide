import { motion } from "framer-motion";

const items = [
    "피정 안내", "강의 정보", "강론 일정", "특강 소식", "피정의 집", "묵상 자료", "성지 순례", "피정 신청",
    "영적 독서", "전례 강의", "성경 공부", "쇄신 피정",
];

export function MarqueeBar() {
    return (
        <div
            className="overflow-hidden py-3 relative"
            style={{
                backgroundColor: "#C9A96E",
                borderTop: "none",
                borderBottom: "none",
            }}
        >
            <div className="flex">
                {[0, 1].map((dupeIdx) => (
                    <motion.div
                        key={dupeIdx}
                        className="flex shrink-0 items-center gap-0"
                        animate={{ x: ["0%", "-100%"] }}
                        transition={{
                            repeat: Infinity,
                            duration: 30,
                            ease: "linear",
                        }}
                    >
                        {items.map((item, i) => (
                            <span
                                key={`${dupeIdx}-${i}`}
                                className="flex items-center"
                                style={{
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    letterSpacing: "0.18em",
                                    color: "#080705",
                                    textTransform: "uppercase",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {item}
                                <span className="mx-6 opacity-40">·</span>
                            </span>
                        ))}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
