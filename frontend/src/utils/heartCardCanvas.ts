/**
 * 세실리아 마음치료 — Canvas 카드 이미지 생성 유틸리티
 * 마음 카드 + 세실리아의 편지 (캘리그라피 스타일)
 */

// ── 감정 등급 정의 ──
export type EmotionGrade = "pax" | "consolatio" | "sanatio" | "fortitudo" | "lux";

interface GradeTheme {
    label: string;
    emoji: string;
    latin: string;
    gradient: [string, string];
    accent: string;
    textColor: string;
}

const GRADE_THEMES: Record<EmotionGrade, GradeTheme> = {
    pax: {
        label: "평화",
        emoji: "\u{1F331}",
        latin: "PAX",
        gradient: ["#1A6B40", "#2D9B5E"],
        accent: "#A8D5BA",
        textColor: "#FFFFFF",
    },
    consolatio: {
        label: "위로",
        emoji: "\u{1F56F}\uFE0F",
        latin: "CONSOLATIO",
        gradient: ["#C9A96E", "#A8853C"],
        accent: "#F5E6C8",
        textColor: "#FFFFFF",
    },
    sanatio: {
        label: "치유",
        emoji: "\u{1F30A}",
        latin: "SANATIO",
        gradient: ["#1B4080", "#2A5FB0"],
        accent: "#A8C4E0",
        textColor: "#FFFFFF",
    },
    fortitudo: {
        label: "용기",
        emoji: "\u{1F525}",
        latin: "FORTITUDO",
        gradient: ["#C83A1E", "#E05A3E"],
        accent: "#F5B8A8",
        textColor: "#FFFFFF",
    },
    lux: {
        label: "빛",
        emoji: "\u271D\uFE0F",
        latin: "LUX",
        gradient: ["#6E2882", "#9B3DB5"],
        accent: "#D4A8E0",
        textColor: "#FFFFFF",
    },
};

// ── 폰트 목록 (랜덤 선택) ──
const CARD_FONTS = ["Nanum Brush Script", "Noto Serif KR"];

// ── 폰트 로딩 ──
let fontsLoaded = false;
async function ensureFontsLoaded(): Promise<void> {
    if (fontsLoaded) return;
    // Nanum Brush Script 로딩
    if (!document.querySelector('link[href*="Nanum+Brush+Script"]')) {
        const link = document.createElement("link");
        link.href =
            "https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
    // Noto Serif KR 로딩 (이미 있을 수 있음)
    if (!document.querySelector('link[href*="Noto+Serif+KR"]')) {
        const link = document.createElement("link");
        link.href =
            "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700;900&display=swap";
        link.rel = "stylesheet";
        document.head.appendChild(link);
    }
    await document.fonts.ready;
    fontsLoaded = true;
}

function getRandomFont(): string {
    return CARD_FONTS[Math.floor(Math.random() * CARD_FONTS.length)];
}

// ── 텍스트 줄바꿈 처리 ──
function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
): string[] {
    const lines: string[] = [];
    const paragraphs = text.split("\n");
    for (const para of paragraphs) {
        const words = para.split("");
        let line = "";
        for (const char of words) {
            const test = line + char;
            if (ctx.measureText(test).width > maxWidth && line.length > 0) {
                lines.push(line);
                line = char;
            } else {
                line = test;
            }
        }
        if (line) lines.push(line);
    }
    return lines;
}

// ── 노이즈 텍스처 오버레이 ──
function drawNoiseOverlay(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    opacity: number
): void {
    const imageData = ctx.createImageData(w, h);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const v = Math.random() * 255;
        imageData.data[i] = v;
        imageData.data[i + 1] = v;
        imageData.data[i + 2] = v;
        imageData.data[i + 3] = opacity * 255;
    }
    ctx.putImageData(imageData, 0, 0);
}

// ── 십자가 장식 ──
function drawCross(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: string
): void {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - size);
    ctx.lineTo(x, y + size);
    ctx.moveTo(x - size * 0.6, y - size * 0.3);
    ctx.lineTo(x + size * 0.6, y - size * 0.3);
    ctx.stroke();
}

// ══════════════════════════════════════════
// 마음 카드 생성
// ══════════════════════════════════════════
export interface HeartCardData {
    message: string;
    hymn?: string;
    emotionGrade: EmotionGrade;
    prayer?: string;
    bibleVerse?: string;
    cardNumber?: number; // 오늘의 몇 번째 카드인지
}

export async function generateHeartCard(
    data: HeartCardData
): Promise<string> {
    await ensureFontsLoaded();

    const SIZE = 1080;
    const SCALE = 2; // Retina
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * SCALE;
    canvas.height = SIZE * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    const grade = GRADE_THEMES[data.emotionGrade] || GRADE_THEMES.consolatio;
    const font = getRandomFont();
    const isBrush = font === "Nanum Brush Script";

    // ── 배경 그라데이션 ──
    const bgGrad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    bgGrad.addColorStop(0, grade.gradient[0]);
    bgGrad.addColorStop(1, grade.gradient[1]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // ── 노이즈 텍스처 ──
    drawNoiseOverlay(ctx, SIZE * SCALE, SIZE * SCALE, 0.03);
    ctx.scale(SCALE, SCALE); // 노이즈 후 스케일 복원 (putImageData resets)
    // Re-apply scale after putImageData
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

    // ── 내부 프레임 (반투명 흰색) ──
    const margin = 60;
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.beginPath();
    ctx.roundRect(margin, margin, SIZE - margin * 2, SIZE - margin * 2, 16);
    ctx.fill();

    // ── 골드 테두리 ──
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(
        margin + 10,
        margin + 10,
        SIZE - margin * 2 - 20,
        SIZE - margin * 2 - 20,
        12
    );
    ctx.stroke();

    // ── 상단: 십자가 + SANCTUS ──
    drawCross(ctx, SIZE / 2, 120, 20, "rgba(255,255,255,0.7)");
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = '12px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("S A N C T U S", SIZE / 2, 160);

    // ── 등급 배지 ──
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    const badgeW = 140;
    const badgeH = 36;
    ctx.beginPath();
    ctx.roundRect(SIZE / 2 - badgeW / 2, 182, badgeW, badgeH, 18);
    ctx.fill();
    ctx.fillStyle = grade.accent;
    ctx.font = '13px "DM Mono", monospace';
    ctx.fillText(
        `${grade.emoji} ${grade.latin}`,
        SIZE / 2,
        182 + badgeH / 2 + 5
    );

    // ── 성경 구절 ──
    let yPos = 260;
    if (data.bibleVerse) {
        const verseSize = isBrush ? 32 : 22;
        ctx.fillStyle = "#FFFFFF";
        ctx.font = `${verseSize}px "${font}", serif`;
        ctx.textAlign = "center";
        const verseLines = wrapText(ctx, `"${data.bibleVerse}"`, SIZE - 200);
        for (const line of verseLines) {
            ctx.fillText(line, SIZE / 2, yPos);
            yPos += verseSize + 10;
        }
        yPos += 10;
    }

    // ── 구분선 ──
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SIZE / 2 - 80, yPos);
    ctx.lineTo(SIZE / 2 + 80, yPos);
    ctx.stroke();
    yPos += 30;

    // ── 세실리아 메시지 ──
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = '11px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText("세실리아가 당신에게", SIZE / 2, yPos);
    yPos += 28;

    const msgSize = isBrush ? 26 : 16;
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `${msgSize}px "${font}", serif`;
    // 메시지를 3줄까지만 표시
    const msgText =
        data.message.length > 120
            ? data.message.slice(0, 117) + "..."
            : data.message;
    const msgLines = wrapText(ctx, msgText, SIZE - 200).slice(0, 4);
    for (const line of msgLines) {
        ctx.fillText(line, SIZE / 2, yPos);
        yPos += msgSize + 8;
    }

    // ── 성가 추천 ──
    if (data.hymn) {
        yPos += 15;
        ctx.fillStyle = grade.accent;
        ctx.font = '12px "DM Mono", monospace';
        ctx.fillText("\u{1F3B5}", SIZE / 2, yPos);
        yPos += 22;
        const hymnSize = isBrush ? 22 : 14;
        ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
        ctx.font = `italic ${hymnSize}px "${font}", serif`;
        const hymnText =
            data.hymn.length > 60 ? data.hymn.slice(0, 57) + "..." : data.hymn;
        const hymnLines = wrapText(ctx, hymnText, SIZE - 220).slice(0, 2);
        for (const line of hymnLines) {
            ctx.fillText(line, SIZE / 2, yPos);
            yPos += hymnSize + 6;
        }
    }

    // ── 하단: 날짜 + 카드 번호 ──
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
    ctx.font = '12px "DM Mono", monospace';
    ctx.textAlign = "center";

    // 구분선
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.beginPath();
    ctx.moveTo(margin + 40, SIZE - 100);
    ctx.lineTo(SIZE - margin - 40, SIZE - 100);
    ctx.stroke();

    ctx.fillText("catholica.kr", SIZE / 2, SIZE - 72);
    if (data.cardNumber) {
        ctx.fillText(
            `${dateStr}  \u00B7  \uB9C8\uC74C \uCE74\uB4DC #${data.cardNumber}/3`,
            SIZE / 2,
            SIZE - 52
        );
    } else {
        ctx.fillText(dateStr, SIZE / 2, SIZE - 52);
    }

    return canvas.toDataURL("image/png", 1.0);
}

// ══════════════════════════════════════════
// 세실리아의 편지 (캘리그라피 스타일)
// ══════════════════════════════════════════
export interface LetterData {
    prayer: string;
    emotionGrade: EmotionGrade;
    bibleVerse?: string;
}

export async function generateCeciliaLetter(
    data: LetterData
): Promise<string> {
    await ensureFontsLoaded();

    const SIZE = 1080;
    const SCALE = 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * SCALE;
    canvas.height = SIZE * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    const grade = GRADE_THEMES[data.emotionGrade] || GRADE_THEMES.consolatio;
    const font = getRandomFont();
    const isBrush = font === "Nanum Brush Script";

    // ── 배경: 아이보리 + 수채화 느낌 ──
    ctx.fillStyle = "#F8F7F4";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // 수채화 원형 블러 효과
    const spots = [
        { x: 200, y: 200, r: 300, color: grade.gradient[0] },
        { x: 850, y: 800, r: 250, color: grade.gradient[1] },
        { x: 500, y: 500, r: 350, color: grade.accent },
    ];
    for (const spot of spots) {
        const grad = ctx.createRadialGradient(
            spot.x,
            spot.y,
            0,
            spot.x,
            spot.y,
            spot.r
        );
        grad.addColorStop(0, spot.color + "18");
        grad.addColorStop(1, spot.color + "00");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // 미세 노이즈
    drawNoiseOverlay(ctx, SIZE * SCALE, SIZE * SCALE, 0.02);
    ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);

    // ── 상단 장식 ──
    drawCross(ctx, SIZE / 2, 100, 18, grade.gradient[0] + "60");
    ctx.fillStyle = grade.gradient[0] + "40";
    ctx.font = '11px "DM Mono", monospace';
    ctx.textAlign = "center";
    ctx.fillText(
        `\u2500\u2500  \uC138\uC2E4\uB9AC\uC544\uC758 \uD3B8\uC9C0  \u2500\u2500`,
        SIZE / 2,
        140
    );

    // ── 등급 표시 ──
    ctx.fillStyle = grade.gradient[0] + "30";
    ctx.font = '10px "DM Mono", monospace';
    ctx.fillText(`${grade.emoji} ${grade.label}`, SIZE / 2, 168);

    // ── 기도문 본문 ──
    let yPos = 230;
    const prayerSize = isBrush ? 36 : 24;
    ctx.fillStyle = "#100F0F";
    ctx.font = `${prayerSize}px "${font}", serif`;
    ctx.textAlign = "center";

    const prayerLines = wrapText(ctx, data.prayer, SIZE - 200);
    const lineHeight = prayerSize + (isBrush ? 16 : 12);
    for (const line of prayerLines.slice(0, 12)) {
        ctx.fillText(line, SIZE / 2, yPos);
        yPos += lineHeight;
    }

    // ── 성경 구절 (하단) ──
    if (data.bibleVerse) {
        yPos = Math.max(yPos + 30, 750);
        ctx.fillStyle = grade.gradient[0] + "80";
        const verseSize = isBrush ? 24 : 16;
        ctx.font = `italic ${verseSize}px "${font}", serif`;
        const verseLines = wrapText(
            ctx,
            `"${data.bibleVerse}"`,
            SIZE - 240
        ).slice(0, 3);
        for (const line of verseLines) {
            ctx.fillText(line, SIZE / 2, yPos);
            yPos += verseSize + 8;
        }
    }

    // ── 서명 ──
    const signY = SIZE - 100;
    ctx.strokeStyle = grade.gradient[0] + "20";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(SIZE / 2 - 60, signY - 20);
    ctx.lineTo(SIZE / 2 + 60, signY - 20);
    ctx.stroke();

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, "0")}.${String(today.getDate()).padStart(2, "0")}`;
    ctx.fillStyle = grade.gradient[0] + "50";
    ctx.font = '12px "DM Mono", monospace';
    ctx.fillText(`\u2014 \uC138\uC2E4\uB9AC\uC544, ${dateStr}`, SIZE / 2, signY);
    ctx.fillStyle = "#9C9891";
    ctx.font = '10px "DM Mono", monospace';
    ctx.fillText("catholica.kr", SIZE / 2, signY + 24);

    return canvas.toDataURL("image/png", 1.0);
}

// ══════════════════════════════════════════
// 유틸: 다운로드 + 공유
// ══════════════════════════════════════════
export function downloadCard(dataUrl: string, filename: string): void {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export async function shareCard(
    dataUrl: string,
    title: string
): Promise<boolean> {
    if (!navigator.share || !navigator.canShare) {
        return false;
    }
    try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], "cecilia-card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) {
            await navigator.share({
                title,
                files: [file],
            });
            return true;
        }
    } catch {
        // 사용자가 공유 취소하거나 지원 안 되는 경우
    }
    return false;
}

export { GRADE_THEMES };
