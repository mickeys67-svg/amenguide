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
