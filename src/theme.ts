import type { Category } from './profile';

// Minimal black: white type, hairline borders, colour only on avatars, icons and dots.
export const C = {
  bg: '#000000',
  surface: '#0A0A0A', // cards
  raised: '#141414', // inputs, icon buttons, inner panels
  line: '#1F1F1F', // card borders, rings
  lineStrong: '#2E2E2E', // button/chip outlines
  text: '#FAFAFA',
  muted: '#A1A1A1',
  faint: '#5C5C5C',
  ink: '#000000', // text on white or on a colour

  blue: '#52A8FF',
  violet: '#8B7CF6',
  purple: '#BF7AF0',
  pink: '#F75F8F',
  orange: '#FF8A3D',
  amber: '#FFC53D',
  green: '#3DD68C',
  teal: '#22C7B8',
  red: '#FF6166',
};

/** Each category gets its own vivid accent: avatars, dots, charts. */
export const CAT_COLOR: Record<Category, string> = {
  builder: C.blue,
  founder: C.orange,
  investor: C.green,
  designer: C.pink,
  researcher: C.violet,
  bd: C.teal,
  degen: C.amber,
};

/** Avatar gradients (Vercel-style), from the category accent into a neighbour. */
export const CAT_GRADIENT: Record<Category, [string, string]> = {
  builder: [C.blue, C.violet],
  founder: [C.amber, C.orange],
  investor: [C.green, C.teal],
  designer: [C.pink, C.purple],
  researcher: [C.violet, C.purple],
  bd: [C.teal, C.blue],
  degen: [C.amber, C.pink],
};

// Cabinet Grotesk, bundled. Pick the face by family name; never set fontWeight
// (Android would synthesize a system font instead).
export const F = {
  regular: 'CabinetGrotesk-Regular',
  medium: 'CabinetGrotesk-Medium',
  bold: 'CabinetGrotesk-Bold',
  xbold: 'CabinetGrotesk-Extrabold',
};

export const T = {
  display: {
    fontFamily: F.bold,
    fontSize: 34,
    color: C.text,
    letterSpacing: -1.1,
  },
  title: {
    fontFamily: F.bold,
    fontSize: 23,
    color: C.text,
    letterSpacing: -0.5,
  },
  header: {
    fontFamily: F.bold,
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.4,
  },
  h2: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.text,
    letterSpacing: -0.2,
  },
  body: { fontFamily: F.regular, fontSize: 14, lineHeight: 20, color: C.text },
  strong: { fontFamily: F.bold, fontSize: 14, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 17, color: C.muted },
  label: {
    fontFamily: F.medium,
    fontSize: 10.5,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },
};

export const R = { card: 14, inner: 10, input: 9, chip: 8, tag: 6 };
