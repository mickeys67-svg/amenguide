/**
 * 공용 스크래핑 상수
 * ai-refiner / sacred-whisper / events.service 3곳에 중복되던 카테고리 목록을 통합
 */

export const VALID_CATEGORIES = [
  '피정', '강론', '강의', '특강', '피정의집',
  '순례', '청년', '문화', '선교', '미사', '뉴스',
] as const;

export type EventCategory = (typeof VALID_CATEGORIES)[number];

/** AI가 반환할 수 있는 카테고리 동의어 → 정규 카테고리 매핑 */
const CATEGORY_ALIASES: Record<string, EventCategory> = {
  '기도회': '미사',
  '성시간': '미사',
  '전례': '미사',
  '연도': '미사',
  '위령미사': '미사',
  '성체조배': '미사',
  '성경공부': '강의',
  '교리': '강의',
  '세미나': '강의',
  '교육': '강의',
  '성령쇄신': '피정',
  '묵상': '피정',
  '관상기도': '피정',
  '영성수련': '피정',
  '봉쇄피정': '피정의집',
  '수도원': '피정의집',
  '음악회': '문화',
  '공연': '문화',
  '전시': '문화',
  '합창': '문화',
  '축제': '문화',
  '콘서트': '문화',
  '성지순례': '순례',
  '도보순례': '순례',
  '봉사': '선교',
  '레지오': '선교',
  '복음화': '선교',
  '자선': '선교',
  '초청강연': '특강',
  '심포지엄': '특강',
  '공개강좌': '특강',
  '청소년': '청년',
  '대학생': '청년',
  '성소': '청년',
};

/** 카테고리 유효성 검사 + 별칭 매핑 + 폴백 */
export function normalizeCategory(raw: string | undefined | null): string {
  if (!raw) return '뉴스';
  if ((VALID_CATEGORIES as readonly string[]).includes(raw)) return raw;
  // 별칭에서 찾기
  const alias = CATEGORY_ALIASES[raw];
  if (alias) return alias;
  return '뉴스';
}
