/**
 * 한국 천주교 16개 교구 목록 (프론트엔드 공용 상수)
 * FilterBar 교구 드롭다운 및 마이페이지에서 사용
 */
export const DIOCESES = [
  '서울대교구',
  '인천교구',
  '수원교구',
  '의정부교구',
  '대전교구',
  '청주교구',
  '부산교구',
  '대구대교구',
  '마산교구',
  '안동교구',
  '춘천교구',
  '원주교구',
  '제주교구',
  '광주대교구',
  '전주교구',
] as const;

export type Diocese = (typeof DIOCESES)[number];
