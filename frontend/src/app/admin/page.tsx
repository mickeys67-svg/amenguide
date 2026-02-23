'use client';

import { useState } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

const THEME_COLORS = [
  { label: '붉은 장미 (Red)', value: '#E63946' },
  { label: '하늘 (Blue)', value: '#457B9D' },
  { label: '황금 (Gold)', value: '#FFB703' },
  { label: '초록 (Green)', value: '#06D6A0' },
  { label: '베이지 (Beige)', value: '#C9A96E' },
];

const CATEGORIES = ['피정', '강론', '행사', '미사', '기도회', '순례', '교육', '기타'];

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    aiSummary: '',
    themeColor: '#457B9D',
    originUrl: '',
    category: '기타',
  });
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey) {
      setStatus({ type: 'error', msg: '관리자 키를 입력해주세요.' });
      return;
    }
    if (!form.title) {
      setStatus({ type: 'error', msg: '제목은 필수입니다.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch(`${API_BASE}/events/admin/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey,
        },
        body: JSON.stringify({
          ...form,
          date: form.date || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setStatus({ type: 'success', msg: `✅ 저장 완료: ${data.title}` });
        setForm({
          title: '',
          date: '',
          location: '',
          aiSummary: '',
          themeColor: '#457B9D',
          originUrl: '',
          category: '기타',
        });
      } else {
        const err = await res.json();
        setStatus({ type: 'error', msg: `❌ 오류: ${err.message ?? res.statusText}` });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ 네트워크 오류: ${(err as Error).message}` });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full border border-stone-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white';
  const labelClass = 'block text-xs font-semibold text-stone-600 mb-1';

  return (
    <main className="min-h-screen bg-stone-50 flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold text-stone-800 mb-1">관리자 — 행사 추가</h1>
        <p className="text-sm text-stone-500 mb-6">수동으로 가톨릭 행사를 등록합니다.</p>

        {/* Admin key */}
        <div className="mb-4">
          <label className={labelClass}>관리자 키 *</label>
          <input
            type="password"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            placeholder="ADMIN_API_KEY"
            className={inputClass}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div>
            <label className={labelClass}>제목 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="예: 2026 봄 피정 프로그램"
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>날짜</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>장소</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="예: 서울 명동대성당"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>테마 색상</label>
            <div className="flex gap-2 flex-wrap">
              {THEME_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm({ ...form, themeColor: c.value })}
                  title={c.label}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    form.themeColor === c.value ? 'border-stone-800 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.value }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>AI 요약 (선택)</label>
            <textarea
              value={form.aiSummary}
              onChange={(e) => setForm({ ...form, aiSummary: e.target.value })}
              placeholder="행사에 대한 간략한 소개 (2-3문장)"
              rows={3}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>원본 URL (선택)</label>
            <input
              type="url"
              value={form.originUrl}
              onChange={(e) => setForm({ ...form, originUrl: e.target.value })}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          {status && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${
                status.type === 'success'
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-stone-300 text-white font-semibold py-2.5 rounded-xl transition-colors"
          >
            {loading ? '저장 중...' : '행사 등록'}
          </button>
        </form>
      </div>
    </main>
  );
}
