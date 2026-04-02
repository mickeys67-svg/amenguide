import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { EventData, CATEGORY_COLORS } from '../types/event';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  event: EventData;
  bookmarked?: boolean;
  onToggleBookmark?: (eventId: string | number) => void;
}

export default function EventCard({ event, bookmarked, onToggleBookmark }: Props) {
  const router = useRouter();
  const color = CATEGORY_COLORS[event.category] || COLORS.primary;

  return (
    <Pressable
      style={styles.card}
      onPress={() => router.push(`/events/${event.id}`)}
    >
      <Image
        source={{ uri: event.image || undefined }}
        style={styles.image}
        contentFit="cover"
        placeholder={require('../../assets/icon.png')}
        transition={200}
      />
      <View style={[styles.categoryBadge, { backgroundColor: color }]}>
        <Text style={styles.categoryText}>{event.category}</Text>
      </View>
      {onToggleBookmark && (
        <Pressable
          style={styles.bookmarkBtn}
          onPress={(e) => {
            e.stopPropagation();
            onToggleBookmark(event.id);
          }}
          hitSlop={10}
        >
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={22}
            color={bookmarked ? COLORS.accent : '#FFF'}
          />
        </Pressable>
      )}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
        <View style={styles.meta}>
          <Ionicons name="calendar-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText}>{event.date}</Text>
        </View>
        <View style={styles.meta}>
          <Ionicons name="location-outline" size={14} color={COLORS.textSecondary} />
          <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: '#E5E7EB',
  },
  categoryBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookmarkBtn: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: SPACING.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 22,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
