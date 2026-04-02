import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { apiFetch } from '../../src/utils/api';
import { authHeaders } from '../../src/utils/auth';
import { EventData } from '../../src/types/event';
import { DIOCESES } from '../../src/constants/dioceses';
import { COLORS, SPACING } from '../../src/constants/theme';
import EventCard from '../../src/components/EventCard';
import DioceseSelector from '../../src/components/DioceseSelector';

export default function MyPageScreen() {
  const router = useRouter();
  const { user, isLoggedIn, logout, refresh, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<'profile' | 'bookmarks'>('profile');
  const [bookmarks, setBookmarks] = useState<EventData[]>([]);
  const [bmLoading, setBmLoading] = useState(false);
  const [name, setName] = useState('');
  const [diocese, setDiocese] = useState<string | null>(null);
  const [showDiocese, setShowDiocese] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setDiocese(user.targetDiocese || null);
    }
  }, [user]);

  const fetchBookmarks = useCallback(async () => {
    setBmLoading(true);
    try {
      const headers = await authHeaders();
      const data = await apiFetch<EventData[]>('/auth/me/bookmarks', { headers });
      setBookmarks(data);
    } catch {} finally {
      setBmLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'bookmarks' && isLoggedIn) fetchBookmarks();
  }, [tab, isLoggedIn, fetchBookmarks]);

  const saveProfile = useCallback(async () => {
    setSaving(true);
    try {
      const headers = await authHeaders();
      await apiFetch('/auth/me', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name, targetDiocese: diocese }),
      });
      await refresh();
      Alert.alert('저장 완료', '프로필이 업데이트되었습니다.');
    } catch {
      Alert.alert('오류', '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  }, [name, diocese, refresh]);

  const handleLogout = useCallback(() => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  if (authLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  }

  if (!isLoggedIn) {
    return (
      <View style={styles.center}>
        <Ionicons name="person-circle-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.loginPrompt}>로그인이 필요합니다</Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/auth')}>
          <Text style={styles.loginBtnText}>로그인 / 회원가입</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabItem, tab === 'profile' && styles.activeTab]}
          onPress={() => setTab('profile')}
        >
          <Text style={[styles.tabText, tab === 'profile' && styles.activeTabText]}>프로필</Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, tab === 'bookmarks' && styles.activeTab]}
          onPress={() => setTab('bookmarks')}
        >
          <Text style={[styles.tabText, tab === 'bookmarks' && styles.activeTabText]}>
            북마크 ({bookmarks.length})
          </Text>
        </Pressable>
      </View>

      {tab === 'profile' ? (
        <ScrollView contentContainerStyle={styles.profileContent}>
          <View style={styles.avatarSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.[0] || '?'}</Text>
            </View>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>이름</Text>
            <TextInput
              style={styles.textInput}
              value={name}
              onChangeText={setName}
              placeholder="이름을 입력하세요"
              placeholderTextColor={COLORS.textLight}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>관심 교구</Text>
            <Pressable style={styles.selectBtn} onPress={() => setShowDiocese(true)}>
              <Text style={styles.selectText}>{diocese || '선택하세요'}</Text>
              <Ionicons name="chevron-down" size={18} color={COLORS.textSecondary} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={saveProfile}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? '저장 중...' : '프로필 저장'}</Text>
          </Pressable>

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={COLORS.error} />
            <Text style={styles.logoutText}>로그아웃</Text>
          </Pressable>

          <DioceseSelector
            visible={showDiocese}
            selected={diocese}
            onSelect={setDiocese}
            onClose={() => setShowDiocese(false)}
          />
        </ScrollView>
      ) : (
        bmLoading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
        ) : bookmarks.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={48} color={COLORS.textLight} />
            <Text style={styles.emptyText}>저장한 행사가 없습니다</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.bookmarkList}>
            {bookmarks.map((e) => (
              <EventCard key={String(e.id)} event={e} bookmarked />
            ))}
          </ScrollView>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: SPACING.md },
  loginPrompt: { fontSize: 16, color: COLORS.textSecondary },
  loginBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 10 },
  loginBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },
  activeTabText: { color: COLORS.primary },
  profileContent: { padding: SPACING.lg },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: '#FFF' },
  email: { fontSize: 14, color: COLORS.textSecondary },
  field: { marginBottom: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: 6 },
  textInput: {
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.text,
  },
  selectBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14,
  },
  selectText: { fontSize: 15, color: COLORS.text },
  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginBottom: SPACING.md },
  saveBtnText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  logoutText: { fontSize: 15, color: COLORS.error, fontWeight: '600' },
  bookmarkList: { padding: SPACING.md, paddingBottom: 100 },
  emptyText: { fontSize: 16, color: COLORS.textLight },
});
