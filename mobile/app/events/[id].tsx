import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, Linking, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/utils/api';
import { authHeaders } from '../../src/utils/auth';
import { EventData, CATEGORY_COLORS } from '../../src/types/event';
import { COLORS, SPACING } from '../../src/constants/theme';

interface Review {
  id: string;
  rating: number;
  content: string;
  user: { name: string };
  createdAt: string;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [ev, rev] = await Promise.all([
          apiFetch<EventData>(`/events/${id}`),
          apiFetch<{ reviews: Review[]; averageRating: number }>(`/reviews?eventId=${id}`).catch(() => ({ reviews: [], averageRating: 0 })),
        ]);
        setEvent(ev);
        setReviews(rev.reviews);
        setAvgRating(rev.averageRating);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const submitReview = useCallback(async () => {
    if (newRating === 0) return;
    setSubmitting(true);
    try {
      const headers = await authHeaders();
      await apiFetch('/reviews', {
        method: 'POST',
        headers,
        body: JSON.stringify({ eventId: id, rating: newRating, content: newComment }),
      });
      const rev = await apiFetch<{ reviews: Review[]; averageRating: number }>(`/reviews?eventId=${id}`);
      setReviews(rev.reviews);
      setAvgRating(rev.averageRating);
      setNewRating(0);
      setNewComment('');
    } catch {
    } finally {
      setSubmitting(false);
    }
  }, [id, newRating, newComment]);

  if (loading || !event) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const color = CATEGORY_COLORS[event.category] || COLORS.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Image source={{ uri: event.image || undefined }} style={styles.hero} contentFit="cover" />

      <View style={styles.body}>
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{event.category}</Text>
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.info}>
          <Ionicons name="calendar" size={18} color={color} />
          <Text style={styles.infoText}>{event.date}</Text>
        </View>
        <View style={styles.info}>
          <Ionicons name="location" size={18} color={color} />
          <Text style={styles.infoText}>{event.location}</Text>
        </View>

        {event.aiSummary && (
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLabel}>AI 요약</Text>
            <Text style={styles.summaryText}>{event.aiSummary}</Text>
          </View>
        )}

        <Text style={styles.description}>{event.description}</Text>

        {event.originUrl && (
          <Pressable
            style={[styles.linkBtn, { backgroundColor: color }]}
            onPress={() => Linking.openURL(event.originUrl!)}
          >
            <Text style={styles.linkBtnText}>원본 페이지 방문</Text>
            <Ionicons name="open-outline" size={16} color="#FFF" />
          </Pressable>
        )}

        {/* Reviews */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>리뷰</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>{avgRating.toFixed(1)} ({reviews.length})</Text>
            </View>
          </View>

          {/* New Review */}
          <View style={styles.newReview}>
            <View style={styles.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setNewRating(n)} hitSlop={6}>
                  <Ionicons
                    name={n <= newRating ? 'star' : 'star-outline'}
                    size={28}
                    color={n <= newRating ? '#F59E0B' : COLORS.textLight}
                  />
                </Pressable>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="리뷰를 남겨주세요..."
              placeholderTextColor={COLORS.textLight}
              value={newComment}
              onChangeText={setNewComment}
              multiline
            />
            <Pressable
              style={[styles.submitBtn, { backgroundColor: color, opacity: newRating === 0 ? 0.5 : 1 }]}
              onPress={submitReview}
              disabled={newRating === 0 || submitting}
            >
              <Text style={styles.submitBtnText}>{submitting ? '등록 중...' : '리뷰 등록'}</Text>
            </Pressable>
          </View>

          {reviews.map((r) => (
            <View key={r.id} style={styles.reviewItem}>
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewAuthor}>{r.user.name}</Text>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons
                      key={n}
                      name={n <= r.rating ? 'star' : 'star-outline'}
                      size={12}
                      color="#F59E0B"
                    />
                  ))}
                </View>
              </View>
              {r.content ? <Text style={styles.reviewContent}>{r.content}</Text> : null}
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { width: '100%', height: 240, backgroundColor: '#E5E7EB' },
  body: { padding: SPACING.lg },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginBottom: SPACING.sm },
  badgeText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md, lineHeight: 30 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoText: { fontSize: 15, color: COLORS.text, flex: 1 },
  summaryBox: { backgroundColor: '#F0F4FF', borderRadius: 12, padding: SPACING.md, marginVertical: SPACING.md },
  summaryLabel: { fontSize: 13, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  summaryText: { fontSize: 14, color: COLORS.text, lineHeight: 22 },
  description: { fontSize: 15, color: COLORS.text, lineHeight: 24, marginVertical: SPACING.md },
  linkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 10 },
  linkBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  reviewSection: { marginTop: SPACING.xl },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  newReview: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, marginBottom: SPACING.md },
  stars: { flexDirection: 'row', gap: 4, marginBottom: SPACING.sm },
  reviewInput: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, padding: 12, fontSize: 14, color: COLORS.text, minHeight: 60, textAlignVertical: 'top', marginBottom: SPACING.sm },
  submitBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  submitBtnText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  reviewItem: { backgroundColor: COLORS.surface, borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.sm },
  reviewMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewAuthor: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewContent: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
});
