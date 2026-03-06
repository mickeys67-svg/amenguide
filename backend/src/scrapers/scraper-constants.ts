/**
 * 공용 스크래핑 상수
 * ai-refiner / sacred-whisper / events.service 3곳에 중복되던 카테고리 목록을 통합
 */

export const VALID_CATEGORIES = [
  '피정', '강론', '강의', '특강', '피정의집',
  '순례', '청년', '문화', '선교', '미사',
] as const;

export type EventCategory = (typeof VALID_CATEGORIES)[number];

/** 카테고리 유효성 검사 + 폴백 */
export function normalizeCategory(raw: string | undefined | null): string {
  if (raw && (VALID_CATEGORIES as readonly string[]).includes(raw)) return raw;
  return '선교';
}
