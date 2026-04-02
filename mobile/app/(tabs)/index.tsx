import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/utils/api';
import { authHeaders } from '../../src/utils/auth';
import { EventData } from '../../src/types/event';
import { COLORS, SPACING } from '../../src/constants/theme';
import EventCard from '../../src/components/EventCard';
import FilterChips from '../../src/components/FilterChips';
import DioceseSelector from '../../src/components/DioceseSelector';

export default function HomeScreen() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('전체');
  const [diocese, setDiocese] = useState<string | null>(null);
  const [showDiocese, setShowDiocese] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string | number>>(new Set());
  const [sortBy, setSortBy] = useState<'date' | 'latest'>('date');

  const fetchEvents = useCallback(async () => {
    try {
      const query = diocese ? `?diocese=${encodeURIComponent(diocese)}` : '';
      const data = await apiFetch<EventData[]>(`/events${query}`);
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    }
  }, [diocese]);

  const fetchBookmarks = useCallback(async () => {
    try {
      const headers = await authHeaders();
      if (!headers.Authorization) return;
      const res = await apiFetch<{ ids: (string | number)[] }>('/auth/me/bookmarked-ids', { headers });
      setBookmarkedIds(new Set(res.ids));
    } catch {}
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchEvents(), fetchBookmarks()]).finally(() => setLoading(false));
  }, [fetchEvents, fetchBookmarks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchEvents(), fetchBookmarks()]);
    setRefreshing(false);
  }, [fetchEvents, fetchBookmarks]);

  const toggleBookmark = useCallback(async (eventId: string | number) => {
    const isBookmarked = bookmarkedIds.has(eventId);
    const newIds = new Set(bookmarkedIds);
    if (isBookmarked) newIds.delete(eventId); else newIds.add(eventId);
    setBookmarkedIds(newIds);

    try {
      const headers = await authHeaders();
      await apiFetch(`/auth/me/bookmarks/${eventId}`, {
        method: isBookmarked ? 'DELETE' : 'POST',
        headers,
      });
    } catch {
      // rollback
      const rollback = new Set(bookmarkedIds);
      if (isBookmarked) rollback.add(eventId); else rollback.delete(eventId);
      setBookmarkedIds(rollback);
    }
  }, [bookmarkedIds]);

  const filtered = useMemo(() => {
    let list = events;
    if (category !== '전체') {
      list = list.filter((e) => e.category === category);
    }
    // Sort
    if (sortBy === 'date') {
      list = [...list].sort((a, b) => {
        const da = a.rawDate || a.date;
        const db = b.rawDate || b.date;
        return new Date(da).getTime() - new Date(db).getTime();
      });
    } else {
      list = [...list].sort((a, b) => {
        const da = a.createdAt || '';
        const db = b.createdAt || '';
        return new Date(db).getTime() - new Date(da).getTime();
      });
    }
    return list;
  }, [events, category, sortBy]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FilterChips selected={category} onSelect={setCategory} />
      <View style={styles.toolbar}>
        <Pressable style={styles.dioceseBtn} onPress={() => setShowDiocese(true)}>
          <Ionicons name="location-outline" size={16} color={COLORS.primary} />
          <Text style={styles.dioceseText}>{diocese || '전체 교구'}</Text>
          <Ionicons name="chevron-down" size={14} color={COLORS.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.sortBtn}
          onPress={() => setSortBy(sortBy === 'date' ? 'latest' : 'date')}
        >
          <Ionicons name="swap-vertical" size={16} color={COLORS.textSecondary} />
          <Text style={styles.sortText}>{sortBy === 'date' ? '날짜순' : '최신순'}</Text>
        </Pressable>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <EventCard
            event={item}
            bookmarked={bookmarkedIds.has(item.id)}
            onToggleBookmark={toggleBookmark}
          />
        )}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>등록된 행사가 없습니다</Text>
          </View>
        }
      />
      <DioceseSelector
        visible={showDiocese}
        selected={diocese}
        onSelect={setDiocese}
        onClose={() => setShowDiocese(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  dioceseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#F0F4FF',
    borderRadius: 8,
  },
  dioceseText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sortText: { fontSize: 13, color: COLORS.textSecondary },
  list: { paddingHorizontal: SPACING.md, paddingBottom: 100 },
  empty: { alignItems: 'center', paddingTop: 80, gap: SPACING.md },
  emptyText: { fontSize: 16, color: COLORS.textLight },
});
