/**
 * 세실리아 마음치료 — Canvas 카드 이미지 생성
 * 5등급 × 10 변형 = 50가지 마음 카드 + 50가지 세실리아의 편지
 */

export type EmotionGrade = "pax" | "consolatio" | "sanatio" | "fortitudo" | "lux";

interface GradeTheme {
    label: string; emoji: string; latin: string;
    bg: string;
    wash1: string; wash2: string; wash3: string;
    textPrimary: string; textSecondary: string;
    cardBg1: string; cardBg2: string;
}

const GRADE_THEMES: Record<EmotionGrade, GradeTheme> = {
    pax: {
        label: "평화", emoji: "🌿", latin: "PAX",
        bg: "#F2EFE4", wash1: "#6B9E7A", wash2: "#A8C49A", wash3: "#CFC886",
        textPrimary: "#243028", textSecondary: "#4E6E50",
        cardBg1: "#1B4332", cardBg2: "#3A7D5C",
    },
    consolatio: {
        label: "위로", emoji: "🕯️", latin: "CONSOLATIO",
        bg: "#F3EBE0", wash1: "#B88558", wash2: "#CFA072", wash3: "#E4C294",
        textPrimary: "#33221A", textSecondary: "#6B4F38",
        cardBg1: "#5C3620", cardBg2: "#8B5E3C",
    },
    sanatio: {
        label: "치유", emoji: "💧", latin: "SANATIO",
        bg: "#E8EEF4", wash1: "#4E7F9A", wash2: "#72A4B8", wash3: "#9CC3D2",
        textPrimary: "#162C3D", textSecondary: "#3E5F78",
        cardBg1: "#13344D", cardBg2: "#245472",
    },
    fortitudo: {
        label: "용기", emoji: "🌅", latin: "FORTITUDO",
        bg: "#F3EBE5", wash1: "#B86A48", wash2: "#CC8860", wash3: "#E0AE8A",
        textPrimary: "#331810", textSecondary: "#6B3E2A",
        cardBg1: "#6B2A16", cardBg2: "#A04E2E",
    },
    lux: {
        label: "빛", emoji: "✨", latin: "LUX",
        bg: "#EDEAF3", wash1: "#6A4F96", wash2: "#8E70B4", wash3: "#BCA0CC",
        textPrimary: "#221638", textSecondary: "#503E6A",
        cardBg1: "#2A1655", cardBg2: "#4E3080",
    },
};

// ══ 폰트 ══
const CARD_FONTS = ["Nanum Brush Script", "Noto Serif KR"];
let fontsLoaded = false;
async function ensureFontsLoaded(): Promise<void> {
    if (fontsLoaded) return;
    for (const f of ["Nanum+Brush+Script", "Noto+Serif+KR:wght@400;700;900"]) {
        if (!document.querySelector(`link[href*="${f.split(":")[0]}"]`)) {
            const link = document.createElement("link");
            link.href = `https://fonts.googleapis.com/css2?family=${f}&display=swap`;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }
    }
    await document.fonts.ready;
    fontsLoaded = true;
}
function getRandomFont(): string {
    return CARD_FONTS[Math.floor(Math.random() * CARD_FONTS.length)];
}

// ══ 공통 유틸 ══
// 단어 단위 줄바꿈 — 괄호 안 내용은 하나의 단어로 묶음
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
    const lines: string[] = [];
    for (const para of text.split("\n")) {
        // 괄호 안 공백을 논브레이킹 스페이스로 치환 → 하나의 단어로 묶임
        const safe = para.replace(/\([^)]+\)/g, m => m.replace(/ /g, "\u00A0"));
        const words = safe.split(/( +)/); // 일반 공백만 분리 (NBSP는 유지)
        let line = "";
        for (const word of words) {
            if (!word) continue;
            const test = line + word;
            if (ctx.measureText(test).width > maxW && line.trim().length > 0) {
                lines.push(line.trimEnd());
                line = word.trimStart(); // 새 줄 시작은 앞 공백 제거
            } else {
                line = test;
            }
            // 한 단어가 너무 길면 글자 단위로 잘라냄
            while (ctx.measureText(line).width > maxW && line.length > 1) {
                let cut = line.length - 1;
                while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxW) cut--;
                lines.push(line.slice(0, cut));
                line = line.slice(cut);
            }
        }
        if (line.trim()) lines.push(line.trimEnd());
    }
    // NBSP를 일반 공백으로 복원
    return lines.map(l => l.replace(/\u00A0/g, " "));
}

// ══ 장식 요소 그리기 함수들 ══

function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, color: string, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
    ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s);
    ctx.moveTo(x - s * 0.6, y - s * 0.3); ctx.lineTo(x + s * 0.6, y - s * 0.3);
    ctx.stroke(); ctx.restore();
}

function drawOlive(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, color: string, flip: boolean, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sz * 0.3, -sz * 0.1, sz * 0.8, -sz * 0.05); ctx.stroke();
    ctx.fillStyle = color;
    for (const l of [{ t: 0.2, a: -0.6, s: 0.3 }, { t: 0.35, a: 0.5, s: 0.25 }, { t: 0.5, a: -0.5, s: 0.28 }, { t: 0.65, a: 0.6, s: 0.22 }, { t: 0.8, a: -0.4, s: 0.2 }]) {
        ctx.save(); ctx.translate(sz * l.t * 0.8, -sz * l.t * 0.05); ctx.rotate(l.a);
        ctx.beginPath(); ctx.ellipse(0, 0, sz * l.s * 0.5, sz * l.s * 0.18, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
}

function drawDove(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, color: string, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(sz / 40, sz / 40);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-5, -8, -2, -12); ctx.quadraticCurveTo(2, -14, 6, -10);
    ctx.quadraticCurveTo(18, -20, 22, -16); ctx.quadraticCurveTo(16, -10, 8, -6);
    ctx.quadraticCurveTo(4, 2, -4, 6); ctx.quadraticCurveTo(-8, 4, -6, 0);
    ctx.quadraticCurveTo(-18, -18, -20, -14); ctx.quadraticCurveTo(-14, -8, -4, -4);
    ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawRays(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string, n: number, alpha = 0.12) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color;
    for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 / n) * i, len = r * (0.5 + Math.random() * 0.5);
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
    }
    ctx.restore();
}

function drawStars(ctx: CanvasRenderingContext2D, S: number, color: string, count: number, alpha = 0.3) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * S, y = Math.random() * S, r = 0.5 + Math.random() * 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawCandle(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, color: string, alpha = 0.5) {
    ctx.save(); ctx.globalAlpha = alpha;
    // 촛대
    ctx.fillStyle = color; ctx.fillRect(x - sz * 0.08, y, sz * 0.16, sz * 0.6);
    // 불꽃
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(x, y - sz * 0.3);
    ctx.quadraticCurveTo(x + sz * 0.15, y - sz * 0.1, x, y + sz * 0.05);
    ctx.quadraticCurveTo(x - sz * 0.15, y - sz * 0.1, x, y - sz * 0.3);
    ctx.fill();
    // 빛 번짐
    const glow = ctx.createRadialGradient(x, y - sz * 0.1, 0, x, y - sz * 0.1, sz * 0.5);
    glow.addColorStop(0, "#FFD700" + "40");
    glow.addColorStop(1, "#FFD700" + "00");
    ctx.fillStyle = glow; ctx.fillRect(x - sz * 0.5, y - sz * 0.6, sz, sz);
    ctx.restore();
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, sz: number, color: string, alpha = 0.2) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(sz / 20, sz / 20);
    ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0, 4); ctx.bezierCurveTo(-10, -6, -18, 4, 0, 16);
    ctx.moveTo(0, 4); ctx.bezierCurveTo(10, -6, 18, 4, 0, 16);
    ctx.fill(); ctx.restore();
}

function drawRosaryBorder(ctx: CanvasRenderingContext2D, S: number, m: number, color: string, alpha = 0.15) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    const gap = 18;
    for (let x = m; x < S - m; x += gap) { ctx.beginPath(); ctx.arc(x, m, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(x, S - m, 2, 0, Math.PI * 2); ctx.fill(); }
    for (let y = m; y < S - m; y += gap) { ctx.beginPath(); ctx.arc(m, y, 2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(S - m, y, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
}

function drawGothicArch(ctx: CanvasRenderingContext2D, S: number, color: string, alpha = 0.1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.5;
    const cx = S / 2, w = S * 0.35, top = S * 0.08, bottom = S * 0.85;
    ctx.beginPath();
    ctx.moveTo(cx - w, bottom); ctx.lineTo(cx - w, S * 0.3);
    ctx.quadraticCurveTo(cx - w, top, cx, top);
    ctx.quadraticCurveTo(cx + w, top, cx + w, S * 0.3);
    ctx.lineTo(cx + w, bottom);
    ctx.stroke(); ctx.restore();
}

function drawVineBorder(ctx: CanvasRenderingContext2D, S: number, m: number, color: string, alpha = 0.12) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1;
    ctx.fillStyle = color;
    // 왼쪽 덩굴
    for (let y = m + 30; y < S - m - 30; y += 40) {
        const x = m + 5 + Math.sin(y * 0.05) * 8;
        ctx.beginPath(); ctx.ellipse(x, y, 5, 3, Math.sin(y * 0.03) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    // 오른쪽 덩굴
    for (let y = m + 50; y < S - m - 30; y += 40) {
        const x = S - m - 5 + Math.sin(y * 0.05) * 8;
        ctx.beginPath(); ctx.ellipse(x, y, 5, 3, Math.sin(y * 0.03) * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawMountain(ctx: CanvasRenderingContext2D, S: number, color: string, alpha = 0.08) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, S);
    ctx.lineTo(S * 0.15, S * 0.75); ctx.lineTo(S * 0.3, S * 0.85);
    ctx.lineTo(S * 0.5, S * 0.65); ctx.lineTo(S * 0.7, S * 0.8);
    ctx.lineTo(S * 0.85, S * 0.7); ctx.lineTo(S, S * 0.82);
    ctx.lineTo(S, S); ctx.closePath(); ctx.fill(); ctx.restore();
}

function drawWaves(ctx: CanvasRenderingContext2D, S: number, color: string, alpha = 0.08) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    for (let w = 0; w < 3; w++) {
        const baseY = S - 60 + w * 20;
        ctx.beginPath(); ctx.moveTo(0, baseY);
        for (let x = 0; x <= S; x += 5) {
            ctx.lineTo(x, baseY + Math.sin(x * 0.02 + w * 1.5) * 12);
        }
        ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}

function drawRainDrops(ctx: CanvasRenderingContext2D, S: number, color: string, count: number, alpha = 0.06) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 0.8;
    for (let i = 0; i < count; i++) {
        const x = Math.random() * S, y = Math.random() * S, len = 10 + Math.random() * 20;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2, y + len); ctx.stroke();
    }
    ctx.restore();
}

function drawWatercolor(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number, S: number) {
    for (let i = 0; i < 3; i++) {
        const ox = (Math.random() - 0.5) * r * 0.3, oy = (Math.random() - 0.5) * r * 0.3;
        const rr = r * (0.8 + Math.random() * 0.4);
        const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rr);
        const a1 = Math.round(alpha * 255).toString(16).padStart(2, '0');
        const a2 = Math.round(alpha * 0.4 * 255).toString(16).padStart(2, '0');
        g.addColorStop(0, color + a1); g.addColorStop(0.5, color + a2); g.addColorStop(1, color + "00");
        ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    }
}

// ══ 분위기 효과 ══

function drawGrain(ctx: CanvasRenderingContext2D, S: number, alpha = 0.04) {
    ctx.save();
    for (let i = 0; i < 6000; i++) {
        const x = Math.random() * S, y = Math.random() * S;
        const b = Math.random() > 0.5 ? 255 : 0;
        ctx.fillStyle = `rgba(${b},${b},${b},${alpha * (0.3 + Math.random() * 0.7)})`;
        ctx.fillRect(x, y, 1, 1);
    }
    ctx.restore();
}

function drawVignette(ctx: CanvasRenderingContext2D, S: number, intensity = 0.35) {
    const g = ctx.createRadialGradient(S / 2, S / 2, S * 0.2, S / 2, S / 2, S * 0.78);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.65, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${intensity})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
}

function drawCornerFlourish(ctx: CanvasRenderingContext2D, S: number, color: string, alpha = 0.15) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = "round";
    const m = 32, sz = 75;
    const corners = [
        { sx: 1, sy: 1, ox: 0, oy: 0 },       // top-left
        { sx: -1, sy: 1, ox: S, oy: 0 },       // top-right
        { sx: 1, sy: -1, ox: 0, oy: S },       // bottom-left
        { sx: -1, sy: -1, ox: S, oy: S },      // bottom-right
    ];
    for (const c of corners) {
        ctx.save(); ctx.translate(c.ox, c.oy); ctx.scale(c.sx, c.sy);
        // 주 곡선
        ctx.beginPath();
        ctx.moveTo(m, m + sz); ctx.quadraticCurveTo(m, m, m + sz, m); ctx.stroke();
        // 내부 곡선
        ctx.beginPath();
        ctx.moveTo(m + 8, m + sz * 0.55); ctx.quadraticCurveTo(m + 8, m + 8, m + sz * 0.55, m + 8); ctx.stroke();
        // 컬 장식
        ctx.beginPath();
        ctx.moveTo(m, m + sz); ctx.quadraticCurveTo(m - 6, m + sz * 0.65, m + 12, m + sz * 0.82); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(m + sz, m); ctx.quadraticCurveTo(m + sz * 0.65, m - 6, m + sz * 0.82, m + 12); ctx.stroke();
        // 중심 점
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(m + 3, m + 3, 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
    ctx.restore();
}

function drawOrnamentalDivider(ctx: CanvasRenderingContext2D, cx: number, y: number, w: number, color: string, alpha = 0.3) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.lineCap = "round";
    ctx.fillStyle = color;
    // 중앙 다이아몬드
    const d = 4;
    ctx.beginPath();
    ctx.moveTo(cx, y - d); ctx.lineTo(cx + d, y); ctx.lineTo(cx, y + d); ctx.lineTo(cx - d, y); ctx.closePath(); ctx.fill();
    // 좌측 선 + 컬
    ctx.beginPath(); ctx.moveTo(cx - d - 6, y); ctx.lineTo(cx - w / 2, y);
    ctx.moveTo(cx - w / 2, y); ctx.quadraticCurveTo(cx - w / 2 - 10, y - 7, cx - w / 2 - 4, y - 12); ctx.stroke();
    // 우측 선 + 컬
    ctx.beginPath(); ctx.moveTo(cx + d + 6, y); ctx.lineTo(cx + w / 2, y);
    ctx.moveTo(cx + w / 2, y); ctx.quadraticCurveTo(cx + w / 2 + 10, y - 7, cx + w / 2 + 4, y - 12); ctx.stroke();
    // 좌우 점 장식
    ctx.beginPath(); ctx.arc(cx - w / 2 - 2, y, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + w / 2 + 2, y, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// ══ 10가지 마음 카드 변형 ══
type CardVariant = (ctx: CanvasRenderingContext2D, S: number, grade: GradeTheme) => void;

const CARD_VARIANTS: CardVariant[] = [
    // 0: Classic — 비둘기 + 올리브
    (ctx, S, g) => {
        drawRays(ctx, S / 2, -30, S * 0.6, "#fff", 10);
        ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 0.8;
        ctx.strokeRect(28, 28, S - 56, S - 56); ctx.strokeRect(33, 33, S - 66, S - 66);
        drawDove(ctx, S / 2, 62, 16, "#fff", 0.25);
        drawOlive(ctx, S / 2 - 18, 78, 30, "#fff", false, 0.15);
        drawOlive(ctx, S / 2 + 18, 78, 30, "#fff", true, 0.15);
    },
    // 1: Cathedral — 고딕 아치
    (ctx, S, g) => {
        drawGothicArch(ctx, S, "#fff", 0.12);
        drawCross(ctx, S / 2, 55, 14, "#fff", 0.3);
        drawRays(ctx, S / 2, 55, S * 0.3, "#fff", 8, 0.06);
    },
    // 2: Starlight — 별빛
    (ctx, S, g) => {
        drawStars(ctx, S, "#fff", 60, 0.2);
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(35, 35, S - 70, S - 70);
        drawCross(ctx, S / 2, 58, 12, "#fff", 0.25);
    },
    // 3: Radiance — 중앙 빛 폭발
    (ctx, S, g) => {
        drawRays(ctx, S / 2, S * 0.4, S * 0.5, "#fff", 20, 0.08);
        drawCross(ctx, S / 2, 60, 15, "#fff", 0.3);
    },
    // 4: Garden — 덩굴 테두리
    (ctx, S, g) => {
        drawVineBorder(ctx, S, 22, "#fff", 0.15);
        drawOlive(ctx, S / 2 - 30, 65, 40, "#fff", false, 0.12);
        drawOlive(ctx, S / 2 + 30, 65, 40, "#fff", true, 0.12);
        drawCross(ctx, S / 2, 55, 10, "#fff", 0.2);
    },
    // 5: Minimal — 초미니멀
    (ctx, S, g) => {
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(40, 40, S - 80, S - 80);
        drawCross(ctx, S / 2, 60, 10, "#fff", 0.2);
    },
    // 6: Rosary — 묵주 테두리
    (ctx, S, g) => {
        drawRosaryBorder(ctx, S, 25, "#fff", 0.18);
        drawCross(ctx, S / 2, 60, 14, "#fff", 0.3);
    },
    // 7: Sacred Heart — 성심
    (ctx, S, g) => {
        drawHeart(ctx, S / 2, 60, 18, "#fff", 0.15);
        drawRays(ctx, S / 2, 60, S * 0.25, "#fff", 8, 0.06);
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(30, 30, S - 60, S - 60);
    },
    // 8: Candle — 촛불
    (ctx, S, g) => {
        drawCandle(ctx, S / 2, 42, 30, "#fff", 0.3);
        ctx.strokeStyle = "rgba(255,255,255,0.1)"; ctx.lineWidth = 0.8;
        ctx.strokeRect(28, 28, S - 56, S - 56);
    },
    // 9: Dove Flight — 비둘기 비행
    (ctx, S, g) => {
        drawDove(ctx, S * 0.3, 70, 12, "#fff", 0.12);
        drawDove(ctx, S / 2, 55, 18, "#fff", 0.2);
        drawDove(ctx, S * 0.7, 70, 12, "#fff", 0.12);
        drawOlive(ctx, S / 2 - 40, 85, 35, "#fff", false, 0.1);
        drawOlive(ctx, S / 2 + 40, 85, 35, "#fff", true, 0.1);
        ctx.strokeStyle = "rgba(255,255,255,0.08)"; ctx.lineWidth = 0.5;
        ctx.strokeRect(32, 32, S - 64, S - 64); ctx.strokeRect(36, 36, S - 72, S - 72);
    },
];

// ══ 10가지 편지 변형 ══
type LetterVariant = (ctx: CanvasRenderingContext2D, S: number, grade: GradeTheme) => void;

const LETTER_VARIANTS: LetterVariant[] = [
    // 0: Classic — 올리브 + 수채화
    (ctx, S, g) => {
        drawWatercolor(ctx, 80, 100, 200, g.wash1, 0.25, S);
        drawWatercolor(ctx, S - 80, S - 100, 180, g.wash2, 0.22, S);
        drawWatercolor(ctx, S / 2, S / 2, 250, g.wash3, 0.15, S);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.5);
        drawOlive(ctx, S / 2 - 14, 58, 24, g.wash1, false, 0.6);
        drawOlive(ctx, S / 2 + 14, 58, 24, g.wash1, true, 0.6);
    },
    // 1: Wave — 물결 + 수채화
    (ctx, S, g) => {
        drawWatercolor(ctx, S / 2, 200, 280, g.wash1, 0.18, S);
        drawWatercolor(ctx, 100, S - 150, 200, g.wash2, 0.15, S);
        drawWaves(ctx, S, g.wash1, 0.1);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.4);
    },
    // 2: Mountain — 산 실루엣
    (ctx, S, g) => {
        drawWatercolor(ctx, S * 0.7, 150, 220, g.wash1, 0.2, S);
        drawWatercolor(ctx, S * 0.3, S * 0.6, 200, g.wash3, 0.15, S);
        drawMountain(ctx, S, g.wash1, 0.1);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.45);
    },
    // 3: Rain — 빗줄기 + 수채화
    (ctx, S, g) => {
        drawWatercolor(ctx, 120, 180, 250, g.wash2, 0.2, S);
        drawWatercolor(ctx, S - 120, S - 180, 220, g.wash1, 0.18, S);
        drawRainDrops(ctx, S, g.wash1, 40, 0.08);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.4);
    },
    // 4: Garden — 올리브 + 덩굴
    (ctx, S, g) => {
        drawWatercolor(ctx, 150, 250, 280, g.wash3, 0.18, S);
        drawWatercolor(ctx, S - 100, 150, 180, g.wash1, 0.15, S);
        drawVineBorder(ctx, S, 30, g.wash1, 0.12);
        drawOlive(ctx, S / 2 - 20, 55, 30, g.wash1, false, 0.5);
        drawOlive(ctx, S / 2 + 20, 55, 30, g.wash1, true, 0.5);
        drawCross(ctx, S / 2, 42, 8, g.textSecondary, 0.35);
    },
    // 5: Sunrise — 따뜻한 하단 빛
    (ctx, S, g) => {
        // 하단 그라데이션
        const sg = ctx.createLinearGradient(0, S * 0.6, 0, S);
        sg.addColorStop(0, g.wash3 + "00"); sg.addColorStop(1, g.wash3 + "30");
        ctx.fillStyle = sg; ctx.fillRect(0, 0, S, S);
        drawWatercolor(ctx, S / 2, 300, 300, g.wash1, 0.15, S);
        drawRays(ctx, S / 2, S, S * 0.5, g.wash1, 12, 0.06);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.45);
    },
    // 6: Starlight — 별 + 수채화
    (ctx, S, g) => {
        drawWatercolor(ctx, 100, 150, 200, g.wash1, 0.22, S);
        drawWatercolor(ctx, S - 100, S - 200, 220, g.wash2, 0.18, S);
        drawStars(ctx, S, g.wash1, 30, 0.15);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.45);
    },
    // 7: Dove — 비둘기 중심
    (ctx, S, g) => {
        drawWatercolor(ctx, S / 2, S / 2, 300, g.wash3, 0.12, S);
        drawWatercolor(ctx, 80, 120, 180, g.wash1, 0.2, S);
        drawDove(ctx, S / 2, 55, 20, g.wash1, 0.35);
        drawOlive(ctx, S / 2 - 20, 70, 28, g.wash1, false, 0.4);
        drawOlive(ctx, S / 2 + 20, 70, 28, g.wash1, true, 0.4);
    },
    // 8: Candle Glow — 촛불 빛
    (ctx, S, g) => {
        drawWatercolor(ctx, S / 2, 200, 250, g.wash3, 0.18, S);
        drawCandle(ctx, S / 2, 35, 25, g.wash1, 0.4);
        drawWatercolor(ctx, S / 2, 80, 120, g.wash1, 0.1, S);
    },
    // 9: Rosary — 묵주 + 수채화
    (ctx, S, g) => {
        drawWatercolor(ctx, 150, 200, 250, g.wash1, 0.2, S);
        drawWatercolor(ctx, S - 120, S - 150, 200, g.wash2, 0.18, S);
        drawRosaryBorder(ctx, S, 28, g.textSecondary, 0.1);
        drawCross(ctx, S / 2, 44, 9, g.textSecondary, 0.45);
    },
];

// ══ 마음 카드 인터페이스 ══
export interface HeartCardData {
    message: string;
    hymn?: string;
    emotionGrade: EmotionGrade;
    prayer?: string;
    bibleVerse?: string;
    cardNumber?: number;
    variant?: number; // 0~9 지정, 없으면 랜덤
}

export async function generateHeartCard(data: HeartCardData): Promise<string> {
    await ensureFontsLoaded();
    const SIZE = 1080, SCALE = 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * SCALE; canvas.height = SIZE * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    const grade = GRADE_THEMES[data.emotionGrade] || GRADE_THEMES.consolatio;
    const font = getRandomFont();
    const isBrush = font === "Nanum Brush Script";
    const variant = data.variant ?? Math.floor(Math.random() * 10);

    // 배경 — 다층 깊이감 그라데이션
    const bg = ctx.createLinearGradient(0, 0, SIZE * 0.3, SIZE);
    bg.addColorStop(0, grade.cardBg1); bg.addColorStop(1, grade.cardBg2);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, SIZE, SIZE);
    // 2차 레이어: 중심부 은은한 밝기
    const bg2 = ctx.createRadialGradient(SIZE * 0.5, SIZE * 0.45, 0, SIZE * 0.5, SIZE * 0.45, SIZE * 0.65);
    bg2.addColorStop(0, "rgba(255,255,255,0.06)"); bg2.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = bg2; ctx.fillRect(0, 0, SIZE, SIZE);

    // 변형 장식 적용
    CARD_VARIANTS[variant](ctx, SIZE, grade);

    // 분위기 효과 — 그레인 + 비네팅 + 코너 장식
    drawGrain(ctx, SIZE, 0.03);
    drawVignette(ctx, SIZE, 0.3);
    drawCornerFlourish(ctx, SIZE, "#fff", 0.12);

    // 등급 라벨 — 상단 컴팩트
    ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.font = '18px "Noto Serif KR", serif'; ctx.textAlign = "center";
    ctx.fillText(`${grade.emoji}  ${grade.latin}  ·  ${grade.label}`, SIZE / 2, 100);
    drawOrnamentalDivider(ctx, SIZE / 2, 114, 160, "#fff", 0.2);

    // ── 콘텐츠 수직 중앙 배치 — 넓은 영역, 큰 폰트 ──
    const cTop = 130, cBottom = SIZE - 55;
    const wrapW = SIZE - 100; // 양쪽 50px 패딩
    const verseSz = isBrush ? 58 : 44;
    const verseLh = verseSz + 14;
    const msgSz = isBrush ? 54 : 42;
    const msgLh = msgSz + 12;
    const hymnSz = isBrush ? 38 : 28;
    const hymnLh = hymnSz + 10;

    // 성경 구절 줄 계산
    let verseLines: string[] = [];
    if (data.bibleVerse) {
        ctx.font = `700 ${verseSz}px "${font}", serif`;
        verseLines = wrap(ctx, `"${data.bibleVerse}"`, wrapW).slice(0, 4);
    }
    // 메시지 줄 계산
    const msgText = data.message.length > 300 ? data.message.slice(0, 297) + "…" : data.message;
    ctx.font = `${msgSz}px "${font}", serif`;
    const msgLines = wrap(ctx, msgText, wrapW).slice(0, 12);
    // 성가 줄 계산
    let hymnLines: string[] = [];
    if (data.hymn) {
        ctx.font = `italic ${hymnSz}px "${font}", serif`;
        const ht = data.hymn.length > 90 ? data.hymn.slice(0, 87) + "…" : data.hymn;
        hymnLines = wrap(ctx, ht, wrapW - 40).slice(0, 3);
    }

    // 총 높이 계산
    let contentH = 0;
    if (verseLines.length) contentH += verseLines.length * verseLh + 10;
    contentH += 50; // 디바이더(24) + 라벨(26)
    contentH += msgLines.length * msgLh;
    if (hymnLines.length) contentH += 36 + hymnLines.length * hymnLh;

    // 수직 중앙 시작점
    let yPos = cTop + Math.max(0, (cBottom - cTop - contentH) / 2);

    // 본문 왼쪽 정렬 (라벨/푸터는 center 유지)
    const textX = 50; // 왼쪽 패딩

    // 성경 구절
    if (verseLines.length) {
        ctx.fillStyle = "rgba(255,255,255,0.97)"; ctx.font = `700 ${verseSz}px "${font}", serif`;
        ctx.textAlign = "left";
        for (const line of verseLines) { ctx.fillText(line, textX, yPos); yPos += verseLh; }
        yPos += 10;
    }

    // 장식 디바이더
    drawOrnamentalDivider(ctx, SIZE / 2, yPos + 2, 200, "#fff", 0.28);
    yPos += 24;

    // 세실리아 메시지 라벨
    ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.font = 'italic 18px "Noto Serif KR", serif';
    ctx.textAlign = "center";
    ctx.fillText("세실리아가 당신에게", SIZE / 2, yPos); yPos += 26;

    // 메시지 본문
    ctx.fillStyle = "rgba(255,255,255,0.93)"; ctx.font = `${msgSz}px "${font}", serif`;
    ctx.textAlign = "left";
    for (const line of msgLines) { ctx.fillText(line, textX, yPos); yPos += msgLh; }

    // 성가
    if (hymnLines.length) {
        yPos += 16;
        ctx.textAlign = "center";
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = '26px serif'; ctx.fillText("♪", SIZE / 2, yPos); yPos += 24;
        ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.font = `italic ${hymnSz}px "${font}", serif`;
        ctx.textAlign = "left";
        for (const line of hymnLines) { ctx.fillText(line, textX + 20, yPos); yPos += hymnLh; }
    }

    // 하단 — 최소 공간
    ctx.textAlign = "center";
    const today = new Date();
    const ds = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.font = '13px "Noto Serif KR", serif';
    ctx.fillText(data.cardNumber ? `catholica.kr  ·  ${ds}  ·  마음 카드 #${data.cardNumber}/3` : `catholica.kr  ·  ${ds}`, SIZE / 2, SIZE - 30);

    return canvas.toDataURL("image/png", 1.0);
}

// ══ 세실리아의 편지 ══
export interface LetterData {
    prayer: string;
    emotionGrade: EmotionGrade;
    bibleVerse?: string;
    variant?: number;
}

export async function generateCeciliaLetter(data: LetterData): Promise<string> {
    await ensureFontsLoaded();
    const SIZE = 1080, SCALE = 2;
    const canvas = document.createElement("canvas");
    canvas.width = SIZE * SCALE; canvas.height = SIZE * SCALE;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(SCALE, SCALE);

    const grade = GRADE_THEMES[data.emotionGrade] || GRADE_THEMES.consolatio;
    const font = getRandomFont();
    const isBrush = font === "Nanum Brush Script";
    const variant = data.variant ?? Math.floor(Math.random() * 10);

    // 배경 — 종이 질감 + 미세 그라데이션
    ctx.fillStyle = grade.bg; ctx.fillRect(0, 0, SIZE, SIZE);
    const lbg = ctx.createRadialGradient(SIZE * 0.35, SIZE * 0.4, 0, SIZE * 0.5, SIZE * 0.5, SIZE * 0.7);
    lbg.addColorStop(0, "rgba(255,255,255,0.08)"); lbg.addColorStop(1, "rgba(0,0,0,0.03)");
    ctx.fillStyle = lbg; ctx.fillRect(0, 0, SIZE, SIZE);

    // 변형 장식 적용
    LETTER_VARIANTS[variant](ctx, SIZE, grade);

    // 분위기 효과 — 미세 그레인 + 소프트 비네팅 + 코너 장식
    drawGrain(ctx, SIZE, 0.02);
    drawVignette(ctx, SIZE, 0.12);
    drawCornerFlourish(ctx, SIZE, grade.textSecondary, 0.1);

    // 제목 — 컴팩트
    ctx.fillStyle = grade.textSecondary; ctx.globalAlpha = 0.7;
    ctx.font = '20px "Noto Serif KR", serif'; ctx.textAlign = "center";
    ctx.fillText("세 실 리 아 의  편 지", SIZE / 2, 78);
    ctx.globalAlpha = 0.45; ctx.font = '15px "Noto Serif KR", serif';
    ctx.fillText(`${grade.emoji} ${grade.label}`, SIZE / 2, 98);
    ctx.globalAlpha = 1;

    drawOrnamentalDivider(ctx, SIZE / 2, 110, 140, grade.textSecondary, 0.25);
    ctx.globalAlpha = 1;

    // ── 콘텐츠 수직 중앙 배치 — 넓은 영역, 큰 폰트 ──
    const wrapW = SIZE - 100;
    const pSz = isBrush ? 58 : 42;
    const lh = pSz + (isBrush ? 18 : 14);
    const vSz = isBrush ? 40 : 28;
    const vLh = vSz + 12;
    const lcTop = 124, lcBottom = SIZE - 70;

    ctx.font = `${pSz}px "${font}", serif`;
    const prayerLines = wrap(ctx, data.prayer, wrapW).slice(0, 14);
    let bibleLines: string[] = [];
    if (data.bibleVerse) {
        ctx.font = `italic ${vSz}px "${font}", serif`;
        bibleLines = wrap(ctx, data.bibleVerse, wrapW - 40).slice(0, 4);
    }

    let lcH = prayerLines.length * lh;
    if (bibleLines.length) lcH += 40 + bibleLines.length * vLh;
    let yPos = lcTop + Math.max(0, (lcBottom - lcTop - lcH) / 2);

    // 기도문 — 왼쪽 정렬
    const ltextX = 50;
    ctx.fillStyle = grade.textPrimary; ctx.font = `${pSz}px "${font}", serif`;
    ctx.textAlign = "left";
    for (const line of prayerLines) { ctx.fillText(line, ltextX, yPos); yPos += lh; }

    // 성경 구절
    if (bibleLines.length) {
        yPos += 28;
        ctx.fillStyle = grade.wash1; ctx.globalAlpha = 0.35; ctx.font = '56px serif';
        ctx.textAlign = "left";
        ctx.fillText("\u201C", ltextX, yPos - 5); ctx.globalAlpha = 1;
        ctx.fillStyle = grade.textSecondary; ctx.globalAlpha = 0.75;
        ctx.font = `italic ${vSz}px "${font}", serif`;
        for (const line of bibleLines) { ctx.fillText(line, ltextX + 20, yPos); yPos += vLh; }
        ctx.globalAlpha = 1;
    }

    // 서명 — 최소 공간
    ctx.textAlign = "center";
    drawOrnamentalDivider(ctx, SIZE / 2, SIZE - 52, 160, grade.textSecondary, 0.18);
    ctx.globalAlpha = 1;
    const today = new Date();
    const ds = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;
    ctx.fillStyle = grade.textSecondary; ctx.globalAlpha = 0.55; ctx.font = '15px "Noto Serif KR", serif';
    ctx.fillText(`— 세실리아, ${ds}  ·  catholica.kr`, SIZE / 2, SIZE - 30); ctx.globalAlpha = 1;

    return canvas.toDataURL("image/png", 1.0);
}

// ══ 유틸 ══
export function downloadCard(dataUrl: string, filename: string): void {
    const a = document.createElement("a"); a.href = dataUrl; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
export async function shareCard(dataUrl: string, title: string): Promise<boolean> {
    if (!navigator.share || !navigator.canShare) return false;
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "cecilia-card.png", { type: "image/png" });
        if (navigator.canShare({ files: [file] })) { await navigator.share({ title, files: [file] }); return true; }
    } catch { /* cancelled */ }
    return false;
}
export { GRADE_THEMES };
