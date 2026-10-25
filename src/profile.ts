export const CATEGORIES = {
  builder: { label: 'Builder', emoji: '🛠️' },
  founder: { label: 'Founder', emoji: '🚀' },
  investor: { label: 'Investor', emoji: '💰' },
  designer: { label: 'Designer', emoji: '🎨' },
  researcher: { label: 'Researcher', emoji: '🔬' },
  bd: { label: 'BD / Growth', emoji: '🤝' },
  degen: { label: 'Degen', emoji: '🎰' },
} as const;
export type Category = keyof typeof CATEGORIES;

// Fixed list so "looking for" ↔ "offering" can be matched offline and counted per room.
export const TAGS = {
  investors: 'Investors',
  cofounder: 'Co-founder',
  devs: 'Devs',
  designers: 'Designers',
  users: 'Users',
  hiring: 'Hiring',
  job: 'A job',
  grants: 'Grants',
  partners: 'Partnerships',
  alpha: 'Alpha',
  frens: 'Frens',
} as const;
export type Tag = keyof typeof TAGS;

export const SOCIALS = {
  x: { label: 'X', url: (h: string) => `https://x.com/${h}` },
  telegram: { label: 'Telegram', url: (h: string) => `https://t.me/${h}` },
  farcaster: {
    label: 'Farcaster',
    url: (h: string) => `https://farcaster.xyz/${h}`,
  },
  github: { label: 'GitHub', url: (h: string) => `https://github.com/${h}` },
  linkedin: {
    label: 'LinkedIn',
    url: (h: string) => `https://linkedin.com/in/${h}`,
  },
} as const;
export type Social = keyof typeof SOCIALS;

export type { WalletProof as Wallet } from './verify';
import type { WalletProof } from './verify';

export type Profile = {
  id: string; // off1… address
  name: string;
  avatar?: string; // base64 jpeg, 256px
  role: string;
  company?: string;
  website?: string; // https://…
  /** What the project does, written by Claude from `url` (the website when it was read). */
  summary?: { text: string; url: string };
  category: Category;
  bio: string;
  building: string;
  lookingFor: Tag[];
  offering: Tag[];
  socials: Partial<Record<Social, string>>;
  wallets: WalletProof[];
  netWorthUsd?: number;
  netWorthAt?: number;
  hideExactNetWorth?: boolean;
};

/** What every phone advertises in its `radius.v1` service capabilities. Public, small. */
export type Card = {
  id: string;
  name: string;
  role: string;
  company?: string;
  category: Category;
  lookingFor: Tag[];
  offering: Tag[];
  netWorthUsd?: number; // undefined when hidden or no wallet
  tier?: string;
  verified: boolean;
  avatarHash?: string;
  summaryHash?: string;
};

// Cheap stable hash (djb2) to tell peers whether a cached avatar is stale.
export function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function tierFor(usd?: number) {
  if (usd == null) return undefined;
  if (usd >= 10_000_000) return '🐋 Whale';
  if (usd >= 1_000_000) return '🦈 Shark';
  if (usd >= 100_000) return '🐬 Dolphin';
  if (usd >= 10_000) return '🐟 Fish';
  if (usd >= 1_000) return '🦀 Crab';
  return '🦐 Shrimp';
}

export function toCapabilities(p: Profile): Record<string, string> {
  const nw = p.hideExactNetWorth ? undefined : p.netWorthUsd;
  const caps: Record<string, string> = {
    n: p.name,
    r: p.role,
    cat: p.category,
    lf: p.lookingFor.join(','),
    of: p.offering.join(','),
    v: p.wallets.length ? '1' : '0',
  };
  if (p.company) caps.c = p.company;
  if (nw != null) caps.nw = String(Math.round(nw));
  const tier = tierFor(p.netWorthUsd);
  if (tier) caps.t = tier;
  if (p.avatar) caps.av = hash(p.avatar);
  if (p.summary) caps.sh = hash(p.summary.text);
  return caps;
}

const tags = (s?: string) =>
  s ? (s.split(',').filter(t => t in TAGS) as Tag[]) : [];

export function fromCapabilities(id: string, c: Record<string, string>): Card {
  return {
    id,
    name: c.n || 'Anon',
    role: c.r || '',
    company: c.c,
    category: (c.cat in CATEGORIES ? c.cat : 'builder') as Category,
    lookingFor: tags(c.lf),
    offering: tags(c.of),
    netWorthUsd: c.nw ? Number(c.nw) : undefined,
    tier: c.t,
    verified: c.v === '1',
    avatarHash: c.av,
    summaryHash: c.sh,
  };
}

/** "uniswap.org" → "https://uniswap.org"; blank → undefined. */
export function websiteUrl(input?: string) {
  const v = input?.trim();
  if (!v) return undefined;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

/** "https://www.uniswap.org/swap" → "uniswap.org" (RN's URL has no hostname). */
export const siteHost = (url: string) =>
  url.replace(/^https?:\/\/(www\.)?/i, '').replace(/[/?#].*$/, '');
