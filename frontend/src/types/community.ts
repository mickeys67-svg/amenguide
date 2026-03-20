export type ReactionType = 'pray' | 'love' | 'peace' | 'wisdom' | 'grace';

export interface ReactionSummary {
  [key: string]: { count: number; mine: boolean };
}

export interface CommunityAuthor {
  id: string;
  name: string;
}

export interface CommunityComment {
  id: string;
  content: string;
  parentId: string | null;
  authorId: string;
  author: CommunityAuthor;
  reactionSummary: ReactionSummary;
  replies?: CommunityComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  category: string;
  status: string;
  isPinned: boolean;
  isClosed: boolean;
  isAnonymous: boolean;
  viewCount: number;
  diocese: string | null;
  authorId: string;
  author: CommunityAuthor;
  commentCount?: number;
  reactionCount?: number;
  reactionSummary?: ReactionSummary;
  comments?: CommunityComment[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityListResponse {
  data: CommunityPost[];
  total: number;
  page: number;
  totalPages: number;
  categoryCounts: Record<string, number>;
}

export interface CommunityStats {
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
}

// 카테고리 정의
export const COMMUNITY_CATEGORIES = [
  { id: '전체', label: '전체', icon: '🏛️', desc: '모든 게시글' },
  { id: '교리문답', label: '교리문답', icon: '📖', desc: '교리에 대한 질문과 답변' },
  { id: '신앙나눔', label: '신앙나눔', icon: '🕊️', desc: '개인 신앙 체험 나눔' },
  { id: '기도요청', label: '기도요청', icon: '🙏', desc: '서로를 위한 기도' },
  { id: '성경공부', label: '성경공부', icon: '✝️', desc: '말씀 묵상과 해석' },
  { id: '전례생활', label: '전례생활', icon: '⛪', desc: '미사, 성체조배, 전례' },
  { id: '자유게시판', label: '자유게시', icon: '💬', desc: '일상 나눔과 정보 공유' },
] as const;

// 리액션 정의
export const REACTION_TYPES: { type: ReactionType; emoji: string; label: string }[] = [
  { type: 'pray', emoji: '🙏', label: '함께 기도합니다' },
  { type: 'love', emoji: '❤️', label: '사랑합니다' },
  { type: 'peace', emoji: '🕊️', label: '평화가 함께' },
  { type: 'wisdom', emoji: '📖', label: '말씀 감사' },
  { type: 'grace', emoji: '💡', label: '은총 가득' },
];

// 은총 등급 정의
export interface GraceLevel {
  userId: string;
  gracePoints: number;
  level: number;
  title: string;
  icon: string;
  postCount: number;
  commentCount: number;
  reactionsReceived: number;
}

export const GRACE_LEVELS = [
  { level: 1, title: '새싹 신자', icon: '🌱', minPoints: 0 },
  { level: 2, title: '묵주의 벗', icon: '📿', minPoints: 25 },
  { level: 3, title: '말씀의 벗', icon: '📖', minPoints: 80 },
  { level: 4, title: '봉헌자', icon: '🕯️', minPoints: 200 },
  { level: 5, title: '사도', icon: '✝️', minPoints: 500 },
] as const;
