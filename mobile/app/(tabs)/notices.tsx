import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/utils/api';
import { Notice, NoticeListResponse } from '../../src/types/notice';
import { COLORS, SPACING } from '../../src/constants/theme';

const CATEGORY_BADGE: Record<string, { bg: string; text: string }> = {
  긴급: { bg: '#FEE2E2', text: '#DC2626' },
  공지: { bg: '#DBEAFE', text: '#1D4ED8' },
  일반: { bg: '#F3F4F6', text: '#6B7280' },
};

export default function NoticesScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  const fetchNotices = useCallback(async (p: number = 1) => {
    try {
      const res = await apiFetch<NoticeListResponse>(`/notices?page=${p}&limit=20`);
      if (p === 1) setNotices(res.data);
      else setNotices((prev) => [...prev, ...res.data]);
      setTotalPages(res.totalPages);
      setPage(p);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchNotices(1).finally(() => setLoading(false));
  }, [fetchNotices]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotices(1);
    setRefreshing(false);
  }, [fetchNotices]);

  const loadMore = useCallback(() => {
    if (page < totalPages) fetchNotices(page + 1);
  }, [page, totalPages, fetchNotices]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  // Detail view
  if (selectedNotice) {
    return (
      <View style={styles.container}>
        <Pressable style={styles.backBtn} onPress={() => setSelectedNotice(null)}>
          <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
          <Text style={styles.backText}>목록으로</Text>
        </Pressable>
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <View style={[styles.catBadge, { backgroundColor: CATEGORY_BADGE[selectedNotice.category]?.bg }]}>
              <Text style={[styles.catText, { color: CATEGORY_BADGE[selectedNotice.category]?.text }]}>
                {selectedNotice.category}
              </Text>
            </View>
            {selectedNotice.isPinned && <Ionicons name="pin" size={16} color={COLORS.accent} />}
          </View>
          <Text style={styles.detailTitle}>{selectedNotice.title}</Text>
          <Text style={styles.detailMeta}>
            {selectedNotice.author.name} · {new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR')}
            · 조회 {selectedNotice.viewCount}
          </Text>
          <Text style={styles.detailContent}>{selectedNotice.content}</Text>
          {selectedNotice.comments.length > 0 && (
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>댓글 ({selectedNotice.comments.length})</Text>
              {selectedNotice.comments.map((c) => (
                <View key={c.id} style={styles.commentItem}>
                  <Text style={styles.commentAuthor}>{c.author.name}</Text>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.noticeItem} onPress={() => setSelectedNotice(item)}>
            <View style={styles.noticeRow}>
              <View style={[styles.catBadge, { backgroundColor: CATEGORY_BADGE[item.category]?.bg }]}>
                <Text style={[styles.catText, { color: CATEGORY_BADGE[item.category]?.text }]}>
                  {item.category}
                </Text>
              </View>
              {item.isPinned && <Ionicons name="pin" size={14} color={COLORS.accent} />}
            </View>
            <Text style={styles.noticeTitle} numberOfLines={2}>{item.title}</Text>
            <View style={styles.noticeMeta}>
              <Text style={styles.noticeMetaText}>{item.author.name}</Text>
              <Text style={styles.noticeMetaText}>
                {new Date(item.createdAt).toLocaleDateString('ko-KR')}
              </Text>
              {(item.commentCount ?? item.comments?.length ?? 0) > 0 && (
                <View style={styles.commentBadge}>
                  <Ionicons name="chatbubble-outline" size={12} color={COLORS.textSecondary} />
                  <Text style={styles.noticeMetaText}>{item.commentCount ?? item.comments?.length}</Text>
                </View>
              )}
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>공지사항이 없습니다</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: SPACING.md },
  noticeItem: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  noticeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  catText: { fontSize: 11, fontWeight: '600' },
  noticeTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginBottom: 6, lineHeight: 22 },
  noticeMeta: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  noticeMetaText: { fontSize: 12, color: COLORS.textSecondary },
  commentBadge: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: 16, color: COLORS.textLight },
  // Detail
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: SPACING.md },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  detailCard: { backgroundColor: COLORS.surface, margin: SPACING.md, borderRadius: 12, padding: SPACING.lg },
  detailHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: SPACING.sm },
  detailTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: 8, lineHeight: 28 },
  detailMeta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.md },
  detailContent: { fontSize: 15, color: COLORS.text, lineHeight: 24 },
  commentsSection: { marginTop: SPACING.lg, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.border },
  commentsTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.sm },
  commentItem: { paddingVertical: SPACING.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: COLORS.border },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 2 },
  commentContent: { fontSize: 14, color: COLORS.textSecondary },
});
