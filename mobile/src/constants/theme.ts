export const COLORS = {
  primary: '#1B4080',
  primaryLight: '#2A5298',
  primaryDark: '#0F2B5C',
  accent: '#C4A35A',
  background: '#F8F6F0',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#DC2626',
  success: '#16A34A',
  warning: '#F59E0B',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export const FONTS = {
  regular: { fontSize: 14, color: COLORS.text },
  medium: { fontSize: 16, fontWeight: '500' as const, color: COLORS.text },
  bold: { fontSize: 16, fontWeight: '700' as const, color: COLORS.text },
  title: { fontSize: 20, fontWeight: '700' as const, color: COLORS.text },
  heading: { fontSize: 24, fontWeight: '700' as const, color: COLORS.text },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
