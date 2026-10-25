// Hidden demo mode: fills the room with seeded attendees so a recording shows a
// busy event. They live in the real peer store, drift around the radar and answer
// profile/wave requests in-process. Toggled by a long-press on "My pass".
import { storage } from './mesh';
import { setFakePeers, type Peer } from './peers';
import {
  fromCapabilities,
  hash,
  toCapabilities,
  type Category,
  type Profile,
  type Tag,
} from './profile';

type Seed = [
  name: string,
  role: string,
  company: string,
  category: Category,
  building: string,
  lookingFor: Tag[],
  offering: Tag[],
  netWorthUsd: number | undefined,
  rssi: number | undefined, // undefined = reached via mesh
  x?: string,
];

const SEEDS: Seed[] = [
  [
    'Priya Raman',
    'General Partner',
    'Lattice Ventures',
    'investor',
    'Writing first checks into onchain consumer apps',
    ['cofounder', 'users'],
    ['investors', 'partners'],
    14_200_000,
    -52,
    'priyavc',
  ],
  [
    'Leo Martins',
    'Protocol Engineer',
    'Zephyr Labs',
    'builder',
    'A ZK coprocessor for cheap historical state proofs',
    ['grants', 'cofounder'],
    ['devs', 'alpha'],
    86_000,
    -61,
    'leo_zk',
  ],
  [
    'Hana Sato',
    'Product Designer',
    'Freelance',
    'designer',
    'Wallet onboarding that does not need a seed phrase',
    ['job', 'frens'],
    ['designers'],
    12_400,
    -48,
    'hanadraws',
  ],
  [
    'Marcus Bell',
    'Founder',
    'Ledgerlight',
    'founder',
    'Stablecoin payroll for remote teams in LatAm',
    ['investors', 'devs'],
    ['hiring', 'job'],
    2_300_000,
    -70,
  ],
  [
    'Aisha Okafor',
    'Head of BD',
    'Meridian L2',
    'bd',
    'Bringing 40 apps to our rollup before mainnet',
    ['partners', 'users'],
    ['grants', 'partners'],
    410_000,
    -66,
    'aisha_bd',
  ],
  [
    'Tom Wexler',
    'Researcher',
    'Ethereum Foundation grantee',
    'researcher',
    'MEV redistribution through encrypted mempools',
    ['grants', 'frens'],
    ['alpha', 'devs'],
    31_000,
    -79,
  ],
  [
    'Nina Volkova',
    'Angel',
    'Independent',
    'investor',
    'Angel checks in AI agents that hold their own wallets',
    ['cofounder', 'alpha'],
    ['investors', 'frens'],
    6_800_000,
    -58,
    'ninaangel',
  ],
  [
    'Kofi Mensah',
    'Smart Contract Dev',
    'Openfield',
    'builder',
    'Gasless intents for cross-chain swaps',
    ['job', 'partners'],
    ['devs'],
    7_900,
    -74,
  ],
  [
    'Sofia Reyes',
    'Founder',
    'Kinship',
    'founder',
    'Onchain group savings circles for families abroad',
    ['investors', 'designers'],
    ['users', 'frens'],
    190_000,
    -55,
    'sofiabuilds',
  ],
  [
    'Jae Park',
    'Full-time degen',
    'Self-employed',
    'degen',
    'Farming every points program so you do not have to',
    ['alpha', 'frens'],
    ['alpha'],
    23_500_000,
    -84,
    'jaeape',
  ],
  [
    'Elena Rossi',
    'Design Lead',
    'Halcyon Wallet',
    'designer',
    'The calmest self-custody wallet on mobile',
    ['designers', 'users'],
    ['hiring', 'designers'],
    640_000,
    undefined,
  ],
  [
    'Dev Patel',
    'CTO',
    'Quill Protocol',
    'founder',
    'Restaking-secured oracles for long-tail assets',
    ['devs', 'investors'],
    ['hiring', 'alpha'],
    3_900_000,
    -88,
  ],
  [
    'Maya Cohen',
    'Partner',
    'Northstar Capital',
    'investor',
    'Leading seed rounds in DePIN and payments',
    ['cofounder', 'partners'],
    ['investors'],
    41_000_000,
    -63,
    'mayacohen',
  ],
  [
    'Omar Haddad',
    'Growth',
    'Pulse Social',
    'bd',
    'Took a Farcaster client from 0 to 80k users',
    ['job', 'partners'],
    ['users', 'partners'],
    54_000,
    undefined,
  ],
  [
    'Grace Lin',
    'PhD Researcher',
    'Stanford',
    'researcher',
    'Formal verification of bridge contracts',
    ['grants', 'devs'],
    ['alpha', 'job'],
    undefined,
    -76,
  ],
];

// A few attendees list a website, so demo cards show an AI summary.
const SITES: Record<string, [url: string, summary: string]> = {
  'Leo Martins': [
    'https://zephyrlabs.xyz',
    'A ZK coprocessor that lets Ethereum contracts prove facts about historical chain state cheaply, without trusting an indexer.',
  ],
  'Marcus Bell': [
    'https://ledgerlight.com',
    'Payroll for remote teams in Latin America, paid in USDC on Base, with local-currency offramps and tax-ready payslips.',
  ],
  'Kofi Mensah': [
    'https://openfield.fi',
    'An intents layer for cross-chain swaps: users sign once and solvers pay the gas and route the trade across chains.',
  ],
  'Sofia Reyes': [
    'https://kinship.app',
    'A mobile app for rotating savings circles, so families across borders can pool stablecoins and take turns withdrawing.',
  ],
  'Elena Rossi': [
    'https://halcyonwallet.com',
    'A self-custody mobile wallet focused on calm, plain-language transaction previews and passkey recovery instead of seed phrases.',
  ],
};

const idFor = (name: string) =>
  `off1q${[0, 1, 2, 3].map(i => hash(name + i)).join('')}`
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 42);

const PROFILES: Profile[] = SEEDS.map(
  ([
    name,
    role,
    company,
    category,
    building,
    lookingFor,
    offering,
    nw,
    ,
    x,
  ]) => ({
    id: idFor(name),
    name,
    role,
    company,
    category,
    bio: '',
    building,
    lookingFor,
    offering,
    socials: x ? { x } : {},
    wallets: [],
    netWorthUsd: nw,
    ...(SITES[name] && {
      website: SITES[name][0],
      summary: { url: SITES[name][0], text: SITES[name][1] },
    }),
  }),
);

// Same EMA as real peers, so the radar breathes without jumping.
const last = new Map<string, number>();
const drift = (id: string, base: number) => {
  const raw = base + (Math.random() - 0.5) * 8;
  const next = Math.round((last.get(id) ?? base) * 0.7 + raw * 0.3);
  last.set(id, next);
  return next;
};

function room(): Peer[] {
  return PROFILES.map((p, i) => {
    const base = SEEDS[i][8];
    return {
      card: {
        ...fromCapabilities(p.id, toCapabilities(p)),
        verified: p.netWorthUsd != null,
      },
      hops: base == null ? 1 + (i % 2) : 0,
      rssi: base == null ? undefined : drift(p.id, base),
      lastSeen: Date.now(),
    };
  });
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function answer(id: string, method: string) {
  await sleep(300 + Math.random() * 500); // feel like BLE
  if (method === 'profile')
    return JSON.stringify(PROFILES.find(p => p.id === id) ?? null);
  if (method === 'wave') return 'ok';
  throw new Error('declined'); // meet needs a real second phone
}

let timer: ReturnType<typeof setInterval> | undefined;

export const isDemo = () => storage.getBoolean('demo') ?? false;

export function setDemo(on: boolean) {
  storage.set('demo', on);
  clearInterval(timer);
  timer = undefined;
  if (!on) return setFakePeers([]);
  PROFILES.forEach(p => storage.set(`peer:${p.id}`, JSON.stringify(p)));
  const tick = () => setFakePeers(room(), answer);
  tick();
  timer = setInterval(tick, 2000);
}
