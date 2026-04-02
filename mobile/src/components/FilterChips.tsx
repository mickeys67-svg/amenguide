import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { CATEGORIES, CATEGORY_COLORS } from '../types/event';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  selected: string;
  onSelect: (category: string) => void;
}

export default function FilterChips({ selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CATEGORIES.map((cat) => {
        const active = selected === cat;
        const color = cat === '전체' ? COLORS.primary : (CATEGORY_COLORS[cat] || COLORS.primary);
        return (
          <Pressable
            key={cat}
            style={[
              styles.chip,
              active && { backgroundColor: color, borderColor: color },
            ]}
            onPress={() => onSelect(cat)}
          >
            <Text style={[styles.chipText, active && { color: '#FFF' }]}>
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
