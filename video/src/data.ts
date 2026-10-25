import type { Category } from "./theme";

// Demo-mode attendees from the app's src/demo.ts, same ids so the avatars match.
const hash = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};
const idFor = (name: string) =>
  `off1q${[0, 1, 2, 3].map((i) => hash(name + i)).join("")}`
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 42);

export type Person = {
  id: string;
  name: string;
  role: string;
  company: string;
  category: Category;
  /** Radar placement: angle in turns, closeness 0 (centre) … 1 (rim). */
  angle: number;
  r: number;
  usd?: number;
  building?: string;
  lf?: string[];
  of?: string[];
};

const p = (
  name: string,
  role: string,
  company: string,
  category: Category,
  angle: number,
  r: number,
  usd?: number,
): Person => ({ id: idFor(name), name, role, company, category, angle, r, usd });

export const SAM = {
  ...p("Sam Okafor", "Founder", "Driftwood", "founder", 0, 0, 12_480_215.6),
  building: "Group trips paid onchain: one shared wallet, no IOUs",
  lf: ["Investors", "Devs", "Designers"],
  of: ["Users", "Partnerships"],
};
export const PRIYA = {
  ...p("Priya Raman", "General Partner", "Lattice Ventures", "investor", 0.08, 0.35, 14_200_000),
  building: "Writing first checks into onchain consumer apps",
  lf: ["Co-founder", "Users"],
  of: ["Investors", "Partnerships"],
};
export const LEO = p("Leo Martins", "Protocol Engineer", "Zephyr Labs", "builder", 0.42, 0.5, 86_000);
export const HANA = p("Hana Sato", "Product Designer", "Freelance", "designer", 0.7, 0.25, 12_400);

/** The room, minus Sam. The first three are the good fits. */
export const ROOM: Person[] = [
  PRIYA,
  LEO,
  HANA,
  p("Marcus Bell", "Founder", "Ledgerlight", "founder", 0.17, 0.7, 2_300_000),
  p("Aisha Okafor", "Head of BD", "Meridian L2", "bd", 0.25, 0.62, 410_000),
  p("Tom Wexler", "Researcher", "EF grantee", "researcher", 0.33, 0.88, 31_000),
  p("Nina Volkova", "Angel", "Independent", "investor", 0.5, 0.55, 6_800_000),
  p("Kofi Mensah", "Smart Contract Dev", "Openfield", "builder", 0.58, 0.8, 7_900),
  p("Sofia Reyes", "Founder", "Kinship", "founder", 0.64, 0.42, 190_000),
  p("Jae Park", "Full-time degen", "Self-employed", "degen", 0.78, 0.92, 23_500_000),
  p("Elena Rossi", "Design Lead", "Halcyon Wallet", "designer", 0.85, 1, 640_000),
  p("Dev Patel", "CTO", "Quill Protocol", "founder", 0.92, 0.95, 3_900_000),
  p("Maya Cohen", "Partner", "Northstar Capital", "investor", 0.0, 0.6, 41_000_000),
  p("Omar Haddad", "Growth", "Pulse Social", "bd", 0.37, 1, 54_000),
  p("Grace Lin", "PhD Researcher", "Stanford", "researcher", 0.13, 0.85),
];

export const money = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(0)}K`
        : `$${Math.round(n)}`;

export const usd = (n: number) =>
  "$ " + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const tierFor = (n: number) =>
  n >= 10_000_000
    ? "🐋 Whale"
    : n >= 1_000_000
      ? "🦈 Shark"
      : n >= 100_000
        ? "🐬 Dolphin"
        : n >= 10_000
          ? "🐟 Fish"
          : n >= 1_000
            ? "🦀 Crab"
            : "🦐 Shrimp";
