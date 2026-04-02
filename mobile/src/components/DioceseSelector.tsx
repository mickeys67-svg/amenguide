import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DIOCESES } from '../constants/dioceses';
import { COLORS, SPACING } from '../constants/theme';

interface Props {
  visible: boolean;
  selected: string | null;
  onSelect: (diocese: string | null) => void;
  onClose: () => void;
}

export default function DioceseSelector({ visible, selected, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>교구 선택</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </Pressable>
          </View>
          <Pressable
            style={[styles.item, !selected && styles.activeItem]}
            onPress={() => { onSelect(null); onClose(); }}
          >
            <Text style={[styles.itemText, !selected && styles.activeText]}>전체 교구</Text>
            {!selected && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
          </Pressable>
          <ScrollView>
            {DIOCESES.map((d) => (
              <Pressable
                key={d}
                style={[styles.item, selected === d && styles.activeItem]}
                onPress={() => { onSelect(d); onClose(); }}
              >
                <Text style={[styles.itemText, selected === d && styles.activeText]}>{d}</Text>
                {selected === d && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  activeItem: {
    backgroundColor: '#F0F4FF',
  },
  itemText: {
    fontSize: 16,
    color: COLORS.text,
  },
  activeText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
