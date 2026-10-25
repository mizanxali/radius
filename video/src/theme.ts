import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

// Tokens copied from the app's src/theme.ts. Never set fontWeight: pick the face.
export const C = {
  bg: "#000000",
  surface: "#0A0A0A",
  raised: "#141414",
  line: "#1F1F1F",
  lineStrong: "#2E2E2E",
  text: "#FAFAFA",
  muted: "#A1A1A1",
  faint: "#5C5C5C",
  ink: "#000000",
  blue: "#52A8FF",
  violet: "#8B7CF6",
  purple: "#BF7AF0",
  pink: "#F75F8F",
  orange: "#FF8A3D",
  amber: "#FFC53D",
  green: "#3DD68C",
  teal: "#22C7B8",
  red: "#FF6166",
};

export type Category =
  | "builder"
  | "founder"
  | "investor"
  | "designer"
  | "researcher"
  | "bd"
  | "degen";

export const CAT_COLOR: Record<Category, string> = {
  builder: C.blue,
  founder: C.orange,
  investor: C.green,
  designer: C.pink,
  researcher: C.violet,
  bd: C.teal,
  degen: C.amber,
};

export const CAT_GRADIENT: Record<Category, [string, string]> = {
  builder: [C.blue, C.violet],
  founder: [C.amber, C.orange],
  investor: [C.green, C.teal],
  designer: [C.pink, C.purple],
  researcher: [C.violet, C.purple],
  bd: [C.teal, C.blue],
  degen: [C.amber, C.pink],
};

export const F = {
  regular: "CabinetGrotesk-Regular",
  medium: "CabinetGrotesk-Medium",
  bold: "CabinetGrotesk-Bold",
  xbold: "CabinetGrotesk-Extrabold",
};

for (const [family, file] of [
  [F.regular, "Regular"],
  [F.medium, "Medium"],
  [F.bold, "Bold"],
  [F.xbold, "Extrabold"],
]) {
  loadFont({ family, url: staticFile(`fonts/CabinetGrotesk-${file}.otf`) });
}

// RN line heights are px; CSS numbers would be multipliers.
export const T = {
  header: { fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.4 },
  title: { fontFamily: F.bold, fontSize: 23, color: C.text, letterSpacing: -0.5 },
  h2: { fontFamily: F.bold, fontSize: 16, color: C.text, letterSpacing: -0.2, lineHeight: "22px" },
  body: { fontFamily: F.regular, fontSize: 14, lineHeight: "20px", color: C.text },
  strong: { fontFamily: F.bold, fontSize: 14, color: C.text },
  sub: { fontFamily: F.regular, fontSize: 12.5, lineHeight: "17px", color: C.muted },
  label: {
    fontFamily: F.medium,
    fontSize: 10.5,
    color: C.muted,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
};

export const R = { card: 14, inner: 10, input: 9, chip: 8, tag: 6 };
