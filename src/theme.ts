import type { Category } from './profile';

export const C = {
  bg: '#07070F',
  surface: '#13131F',
  surface2: '#1C1C2E',
  line: '#2A2A40',
  text: '#FFFFFF',
  muted: '#8E8EAA',
  money: '#B6FF3B',
  hot: '#FF2E93',
};

export const G = {
  hot: ['#FF2E93', '#FF7A18'],
  cool: ['#7B61FF', '#00D4FF'],
  money: ['#B6FF3B', '#3BFFB0'],
  radar: ['#7B61FF', '#FF2E93', '#FF7A18'],
};

export const CAT_COLOR: Record<Category, string> = {
  builder: '#00D4FF',
  founder: '#FF7A18',
  investor: '#B6FF3B',
  designer: '#FF2E93',
  researcher: '#7B61FF',
  bd: '#FFD23F',
  degen: '#FF4D4D',
};

export const H1 = {
  color: C.text,
  fontSize: 34,
  fontWeight: '900' as const,
  letterSpacing: -1,
};
export const H2 = {
  color: C.text,
  fontSize: 22,
  fontWeight: '800' as const,
  letterSpacing: -0.5,
};
export const BODY = { color: C.text, fontSize: 16, lineHeight: 22 };
export const LABEL = {
  color: C.muted,
  fontSize: 12,
  fontWeight: '700' as const,
  letterSpacing: 1.2,
  textTransform: 'uppercase' as const,
};
