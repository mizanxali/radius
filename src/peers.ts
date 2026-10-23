import { useSyncExternalStore } from 'react';
import {
  isLocalTransport,
  myNodeHash,
  onPeerRssi,
  protocol,
  SERVICE_ID,
  services,
  startMesh,
  storage,
  type NeighborDiscoveredEvent,
  type ServiceDiscoveredEvent,
  type ServiceRequestReceivedEvent,
  type ServiceResponseReceivedEvent,
} from './mesh';
import {
  fromCapabilities,
  getMyProfile,
  hash,
  toCapabilities,
  type Card,
  type Profile,
} from './profile';

export type Peer = {
  card: Card;
  hops: number;
  rssi?: number; // smoothed dBm, BLE only
  lastSeen: number;
};

const STALE_MS = 90_000;
const DISCOVER_EVERY_MS = 10_000;

let me = '';
const peers = new Map<string, Peer>();
const byHash = new Map<string, string>(); // advertised node hash → off1
let snapshot: Peer[] = [];
const listeners = new Set<() => void>();

function emit() {
  snapshot = [...peers.values()].sort(
    (a, b) => a.hops - b.hops || (b.rssi ?? -127) - (a.rssi ?? -127),
  );
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function usePeers() {
  return useSyncExternalStore(subscribe, () => snapshot);
}

export function usePeer(id: string) {
  return useSyncExternalStore(subscribe, () => peers.get(id));
}

export const myAddress = () => me;
export const useMyAddress = () => useSyncExternalStore(subscribe, myAddress);

// ---- request/response over the radius.v1 service --------------------------

type Pending = { resolve: (body: string) => void; reject: (e: Error) => void };
const pending = new Map<string, Pending>();
const early = new Map<string, ServiceResponseReceivedEvent>();

function settle(e: ServiceResponseReceivedEvent) {
  const p = pending.get(e.request_id);
  if (!p) return void early.set(e.request_id, e);
  pending.delete(e.request_id);
  if (e.status === 'ok') p.resolve(e.body);
  else p.reject(new Error(e.body || e.status));
}

export async function request(
  peerId: string,
  method: string,
  body = '',
  timeoutMs = 20_000,
) {
  const id = await services.sendServiceRequest(
    peerId,
    SERVICE_ID,
    method,
    body,
  );
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error('timeout'));
    }, timeoutMs);
    pending.set(id, {
      resolve: b => (clearTimeout(timer), resolve(b)),
      reject: e => (clearTimeout(timer), reject(e)),
    });
    const got = early.get(id);
    if (got) early.delete(id), settle(got);
  });
}

type Handler = (body: string, sender: string) => string | Promise<string>;
const handlers: Record<string, Handler> = {
  profile: () => {
    const p = getMyProfile();
    // "Hide exact amount" means the number never leaves the phone; the card still carries the tier.
    return JSON.stringify(
      p?.hideExactNetWorth ? { ...p, netWorthUsd: undefined } : p ?? null,
    );
  },
};

/** Lets later features (wave, meet…) answer their own request methods. */
export function handle(method: string, h: Handler) {
  handlers[method] = h;
}

// ---- full profiles ----------------------------------------------------------

export const cachedProfile = (id: string): Profile | undefined => {
  const raw = storage.getString(`peer:${id}`);
  return raw ? JSON.parse(raw) : undefined;
};

export async function fetchProfile(id: string): Promise<Profile | undefined> {
  const p = JSON.parse(await request(id, 'profile')) as Profile | null;
  if (!p || p.id !== id) return undefined; // a peer can only describe itself
  storage.set(`peer:${id}`, JSON.stringify(p));
  emit(); // new avatar → re-render radar
  return p;
}

// Profiles (with avatars) are pulled in the background, one at a time so a
// crowded room doesn't flood the BLE links, and again when a card's avatar changes.
const queue: string[] = [];
let fetching = false;
function prefetch(card: Card) {
  const cached = cachedProfile(card.id);
  const fresh =
    cached &&
    (cached.avatar ? hash(cached.avatar) : undefined) === card.avatarHash &&
    cached.name === card.name;
  if (fresh || queue.includes(card.id)) return;
  queue.push(card.id);
  void drain();
}
async function drain() {
  if (fetching) return;
  fetching = true;
  while (queue.length) {
    const id = queue.shift()!;
    await fetchProfile(id).catch(() => {});
  }
  fetching = false;
}

// ---- my card ----------------------------------------------------------------

export async function publishCard() {
  const p = getMyProfile();
  if (!me || !p) return;
  await services.unregisterService(SERVICE_ID).catch(() => {});
  await services.registerService(SERVICE_ID, '1', {
    ...toCapabilities(p),
    nh: myNodeHash,
  });
}

// ---- wiring -----------------------------------------------------------------

const discover = () => services.discoverServices(SERVICE_ID).catch(() => {});

function upsert(id: string, f: (p: Peer | undefined) => Peer | undefined) {
  const next = f(peers.get(id));
  if (next) peers.set(id, next);
  emit();
}

let booted = false;
export async function bootMesh() {
  if (booted) return;
  booted = true;

  protocol.on<NeighborDiscoveredEvent>('neighbor_discovered', e => {
    if (isLocalTransport(e.transport)) discover();
  });

  protocol.on<ServiceDiscoveredEvent>('service_discovered', e => {
    if (e.service_id !== SERVICE_ID || e.provider_peer_id === me) return;
    const card = fromCapabilities(e.provider_peer_id, e.capabilities);
    if (e.capabilities.nh) byHash.set(e.capabilities.nh, e.provider_peer_id);
    upsert(card.id, p => ({
      rssi: p?.rssi,
      card,
      hops: e.hop_count,
      lastSeen: Date.now(),
    }));
    prefetch(card);
  });

  onPeerRssi((rssi, peerId, nodeHash) => {
    const id = peerId ?? (nodeHash ? byHash.get(nodeHash) : undefined);
    if (!id || !peers.has(id)) return;
    upsert(
      id,
      p =>
        p && {
          ...p,
          // EMA: raw BLE RSSI swings ±8 dB between samples.
          rssi: p.rssi == null ? rssi : Math.round(p.rssi * 0.7 + rssi * 0.3),
          lastSeen: Date.now(),
        },
    );
  });

  protocol.on<ServiceRequestReceivedEvent>(
    'service_request_received',
    async e => {
      if (e.service_id !== SERVICE_ID) return;
      const h = handlers[e.method];
      let status = 'ok';
      let body: string;
      try {
        body = h ? await h(e.body, e.sender) : 'unknown method';
        if (!h) status = 'error';
      } catch (err) {
        status = 'error';
        body = String(err);
      }
      services
        .respondToServiceRequest(
          e.request_id,
          e.sender,
          SERVICE_ID,
          status,
          body,
        )
        .catch(() => {});
    },
  );

  protocol.on<ServiceResponseReceivedEvent>('service_response_received', e => {
    if (e.service_id === SERVICE_ID) settle(e);
  });

  me = await startMesh();
  emit();
  await publishCard();
  discover();

  setInterval(() => {
    discover();
    const now = Date.now();
    let changed = false;
    for (const [id, p] of peers) {
      if (now - p.lastSeen > STALE_MS) changed = peers.delete(id) || changed;
    }
    if (changed) emit();
  }, DISCOVER_EVERY_MS);
}
