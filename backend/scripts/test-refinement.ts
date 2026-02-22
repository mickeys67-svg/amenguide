import { AiRefinerService } from '../src/scrapers/ai-refiner.service';
import * as dotenv from 'dotenv';
dotenv.config();

async function testRefinement() {
    const refiner = new AiRefinerService();
    const sampleText = `
        [공지] 제15회 성모 마리아 피정 안내
        일시: 2026년 5월 20일 오전 10시
        장소: 명동대성당 지하 소성당
        내용: 성모님의 영성을 본받아 평화를 찾는 침묵 피정에 여러분을 초대합니다. 
        강사: 김대건 안드레아 신부님
        준비물: 미사도구, 개인 묵주
    `;

    console.log('--- TESTING AI REFINEMENT ---');
    try {
        const result = await refiner.refine(sampleText);
        console.log('RESULT:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.error('TEST FAILED:', err.message);
    }
}

testRefinement();
