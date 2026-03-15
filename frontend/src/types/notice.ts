export interface Notice {
  id: string;
  title: string;
  content: string;
  category: '일반' | '공지' | '긴급';
  isPinned: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  viewCount: number;
  authorId: string;
  author: { id: string; name: string };
  comments: NoticeComment[];
  attachments: NoticeAttachment[];
  commentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeComment {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; name: string };
  createdAt: string;
}

export interface NoticeAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
}

export interface NoticeListResponse {
  data: Notice[];
  total: number;
  page: number;
  totalPages: number;
}
