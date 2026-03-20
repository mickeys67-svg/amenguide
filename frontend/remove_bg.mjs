import sharp from 'sharp';
import { writeFileSync } from 'fs';

const input = './public/logo.png';

const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

const buf = new Uint8ClampedArray(data);

for (let i = 0; i < buf.length; i += 4) {
    const r = buf[i], g = buf[i+1], b = buf[i+2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    const maxC = Math.max(r, g, b);
    const satRatio = maxC > 0 ? (maxC - Math.min(r, g, b)) / maxC : 0;

    // 밝고 무채색 픽셀 → 투명 처리 (로고 마크는 lum<64, 배경은 lum>180)
    if (lum > 180 && satRatio < 0.25) {
        buf[i+3] = 0;
    } else if (lum > 130 && satRatio < 0.15) {
        // 경계 부드러운 페이드
        const t = (lum - 130) / 50;
        buf[i+3] = Math.round((1 - t) * buf[i+3]);
    }
}

const out = await sharp(Buffer.from(buf.buffer), {
    raw: { width: info.width, height: info.height, channels: 4 }
}).png({ compressionLevel: 9 }).toBuffer();

writeFileSync(input, out);
console.log(`완료: ${(out.length / 1024).toFixed(1)} KB — 배경 제거됨`);
