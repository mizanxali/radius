import {
  createAppKit,
  solana,
  type AppKitNetwork,
  type Storage,
} from '@reown/appkit-react-native';
import { EthersAdapter } from '@reown/appkit-ethers-react-native';
import { SolanaAdapter } from '@reown/appkit-solana-react-native';
import { ConnectionsController } from '@reown/appkit-core-react-native';
import { storage } from './mesh';
import type { Profile } from './profile';
import { getMyProfile } from './peers';
import { publishCard } from './peers';
import { proofMessage, type Chain, type WalletProof } from './verify';
import { REOWN_PROJECT_ID, WORKER_URL } from './config';

const ethereum: AppKitNetwork = {
  id: 1,
  name: 'Ethereum',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['https://cloudflare-eth.com'] } },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://etherscan.io' },
  },
  chainNamespace: 'eip155',
  caipNetworkId: 'eip155:1',
};

// AppKit's session store, on the same MMKV the rest of the app uses.
const PREFIX = 'appkit:';
const appKitStorage: Storage = {
  getKeys: async () =>
    storage
      .getAllKeys()
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length)),
  getEntries: async <T>() =>
    (await appKitStorage.getKeys()).map(
      k =>
        [k, JSON.parse(storage.getString(PREFIX + k) ?? 'null')] as [string, T],
    ),
  getItem: async <T>(k: string) => {
    const v = storage.getString(PREFIX + k);
    return v == null ? undefined : (JSON.parse(v) as T);
  },
  setItem: async (k, v) => storage.set(PREFIX + k, JSON.stringify(v)),
  removeItem: async k => void storage.remove(PREFIX + k),
};

export const appKit = createAppKit({
  projectId: REOWN_PROJECT_ID,
  networks: [ethereum, solana],
  defaultNetwork: ethereum,
  adapters: [new EthersAdapter(), new SolanaAdapter()],
  storage: appKitStorage,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: { accent: '#52A8FF' }, // theme C.blue
  // Real wallets only: email/social logins would create empty embedded wallets.
  features: { socials: false, swaps: false, onramp: false },
  metadata: {
    name: 'Radius',
    description: 'See who is around you at web3 events',
    url: 'https://radius.xyz',
    icons: [],
    redirect: { native: 'radius://' },
  },
});

const saveProfile = (p: Profile) => storage.set('profile', JSON.stringify(p));

/** Asks the connected wallet to sign the Radius proof and stores it on my profile. */
export async function proveWallet(
  caipAddress: `${string}:${string}:${string}`,
) {
  const me = getMyProfile();
  if (!me) throw new Error('no profile');
  const [namespace, , address] = caipAddress.split(':');
  const chain: Chain = namespace === 'solana' ? 'solana' : 'evm';
  const issuedAt = Date.now();
  const sig = await ConnectionsController.signMessage(
    caipAddress,
    proofMessage(address, me.id, issuedAt),
  );
  if (!sig) throw new Error('wallet did not sign');
  const proof: WalletProof = { chain, address, sig, issuedAt };
  saveProfile({
    ...me,
    wallets: [
      ...me.wallets.filter(
        w => w.address.toLowerCase() !== address.toLowerCase(),
      ),
      proof,
    ],
  });
  await refreshNetWorth();
}

export async function removeWallet(address: string) {
  const me = getMyProfile();
  if (!me) return;
  const wallets = me.wallets.filter(w => w.address !== address);
  saveProfile({
    ...me,
    wallets,
    netWorthUsd: wallets.length ? me.netWorthUsd : undefined,
  });
  if (wallets.length) await refreshNetWorth();
  else await publishCard();
}

/** Re-prices my verified wallets through the Worker and re-advertises my card. */
export async function refreshNetWorth() {
  const me = getMyProfile();
  if (!me?.wallets.length) return;
  const res = await fetch(`${WORKER_URL}/networth`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      wallets: me.wallets.map(({ chain, address }) => ({ chain, address })),
    }),
  });
  if (!res.ok) throw new Error(`networth ${res.status}`);
  const { usd } = (await res.json()) as { usd: number };
  saveProfile({ ...getMyProfile()!, netWorthUsd: usd, netWorthAt: Date.now() });
  await publishCard();
}
