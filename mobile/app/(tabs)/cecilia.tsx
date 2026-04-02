import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../../src/utils/api';
import { COLORS, SPACING } from '../../src/constants/theme';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const EMOTION_CATEGORIES = [
  { label: '위로가 필요해요', icon: 'heart-outline' as const, feeling: '마음이 힘들고 위로가 필요합니다' },
  { label: '감사한 마음', icon: 'sunny-outline' as const, feeling: '감사한 마음을 나누고 싶습니다' },
  { label: '기도가 필요해요', icon: 'hand-left-outline' as const, feeling: '기도로 위로를 받고 싶습니다' },
  { label: '행사 추천', icon: 'calendar-outline' as const, feeling: '참여할 수 있는 가톨릭 행사를 찾고 있습니다' },
];

export default function CeciliaScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await apiFetch<{ reply: string; events?: unknown[] }>('/events/ai-recommend', {
        method: 'POST',
        body: JSON.stringify({
          feeling: text.trim(),
          history: messages.slice(-6).map((m) => `${m.role}: ${m.content}`).join('\n'),
        }),
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply || '죄송합니다. 잠시 후 다시 말씀해 주세요.',
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), role: 'assistant', content: '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [loading, messages]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Welcome */}
        {messages.length === 0 && (
          <View style={styles.welcome}>
            <View style={styles.avatarCircle}>
              <Ionicons name="heart" size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.welcomeTitle}>세실리아 AI</Text>
            <Text style={styles.welcomeDesc}>
              마음의 이야기를 나누어 주세요.{'\n'}
              위로와 기도, 행사 추천을 도와드립니다.
            </Text>
            <View style={styles.chips}>
              {EMOTION_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.label}
                  style={styles.emotionChip}
                  onPress={() => send(cat.feeling)}
                >
                  <Ionicons name={cat.icon} size={18} color={COLORS.primary} />
                  <Text style={styles.emotionText}>{cat.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.assistantBubble]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.botLabel}>
                <Ionicons name="heart" size={14} color={COLORS.primary} />
                <Text style={styles.botName}>세실리아</Text>
              </View>
            )}
            <Text style={[styles.bubbleText, msg.role === 'user' && { color: '#FFF' }]}>
              {msg.content}
            </Text>
          </View>
        ))}

        {loading && (
          <View style={[styles.bubble, styles.assistantBubble]}>
            <ActivityIndicator size="small" color={COLORS.primary} />
          </View>
        )}
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="마음을 나누어 주세요..."
          placeholderTextColor={COLORS.textLight}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={() => send(input)}
          blurOnSubmit={false}
        />
        <Pressable
          style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
          onPress={() => send(input)}
          disabled={!input.trim() || loading}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  messages: { flex: 1 },
  messagesContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  welcome: { alignItems: 'center', paddingVertical: 40 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0F4FF', alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  welcomeDesc: { fontSize: 15, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.lg },
  emotionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  emotionText: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  bubble: { maxWidth: '82%', padding: 14, borderRadius: 16, marginBottom: SPACING.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: COLORS.surface, borderBottomLeftRadius: 4 },
  botLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 },
  botName: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  bubbleText: { fontSize: 15, color: COLORS.text, lineHeight: 22 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  input: {
    flex: 1, maxHeight: 100, paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: COLORS.background, borderRadius: 20,
    fontSize: 15, color: COLORS.text,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
});
