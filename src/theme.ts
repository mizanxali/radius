import type { Category } from './profile';

// Soft neobank palette: charcoal surfaces, pastel accents, white for primary actions.
export const C = {
  bg: '#2F2F34',
  surface: '#37383D',
  raised: '#414248', // circle buttons, inputs, inner cards
  line: '#4B4C53',
  text: '#FFFFFF',
  muted: '#A3A3AD',
  faint: '#6F7079',
  ink: '#1E1E22', // text on white / pastel

  blue: '#8FB8F0',
  blueDeep: '#648FBF',
  lilac: '#DE8FF7',
  mint: '#9DE3C4',
  peach: '#FFB48C',
  butter: '#F4DC82',
  rose: '#F6A3BC',
  periwinkle: '#B7AAFF',
};

/** Each category gets its own pastel, used for cards, avatars and charts. */
export const CAT_COLOR: Record<Category, string> = {
  builder: C.blue,
  founder: C.peach,
  investor: C.mint,
  designer: C.lilac,
  researcher: C.periwinkle,
  bd: C.rose,
  degen: C.butter,
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
    fontFamily: F.medium,
    fontSize: 44,
    color: C.text,
    letterSpacing: -1,
  },
  title: {
    fontFamily: F.medium,
    fontSize: 30,
    color: C.text,
    letterSpacing: -0.5,
  },
  header: { fontFamily: F.medium, fontSize: 22, color: C.text },
  h2: { fontFamily: F.medium, fontSize: 22, color: C.text },
  body: { fontFamily: F.regular, fontSize: 16, lineHeight: 22, color: C.text },
  strong: { fontFamily: F.bold, fontSize: 16, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 14, lineHeight: 19, color: C.muted },
  label: { fontFamily: F.medium, fontSize: 15, color: C.muted },
};

export const R = { card: 28, inner: 20, pill: 999 };
