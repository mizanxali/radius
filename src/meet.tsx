import { useEffect, useSyncExternalStore } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useMMKVObject } from 'react-native-mmkv';
import Haptics from 'react-native-haptic-feedback';
import { bytesToHex } from '@noble/hashes/utils.js';
import { protocol, storage } from './mesh';
import {
  cachedProfile,
  getMyProfile,
  handle,
  myAddress,
  request,
} from './peers';
import {
  addressOf,
  meetMessage,
  noWallet,
  verifyMeet,
  type MeetPayload,
  type MeetProof,
} from './meetproof';
import { WORKER_URL } from './config';
import { Avatar, Button } from './ui';
import { C, T } from './theme';

export type Stamp = {
  id: string; // sigB: both phones know it
  peer: { id: string; name: string; role?: string; company?: string };
  payload: MeetPayload;
  proof?: MeetProof; // complete once both signatures are known
  status: 'pending' | 'minted' | 'failed';
  url?: string;
};

const KEY = 'stamps';
const load = (): Stamp[] => JSON.parse(storage.getString(KEY) ?? '[]');
const save = (s: Stamp) =>
  storage.set(KEY, JSON.stringify([s, ...load().filter(x => x.id !== s.id)]));
export const useStamps = () => useMMKVObject<Stamp[]>(KEY, storage)[0] ?? [];

let myPub: string | undefined;
const pub = async () =>
  (myPub ??= bytesToHex(
    Uint8Array.from(await protocol.getIdentityPublicKey()),
  ));
const sign = async (p: MeetPayload) =>
  bytesToHex(await protocol.signDataBytes(meetMessage(p)));
const myWallet = () =>
  getMyProfile()?.wallets.find(w => w.chain === 'evm')?.address ?? noWallet;

const peerInfo = (id: string) => {
  const p = cachedProfile(id);
  return { id, name: p?.name ?? 'Someone', role: p?.role, company: p?.company };
};

async function mint(stamp: Stamp) {
  if (!stamp.proof) return;
  try {
    const res = await fetch(`${WORKER_URL}/attest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(stamp.proof),
    });
    if (!res.ok) throw new Error(`attest ${res.status}`);
    const { url } = (await res.json()) as { url: string };
    const done: Stamp = { ...stamp, status: 'minted', url };
    save(done);
    Haptics.trigger('notificationSuccess');
    // Tell the other phone where its stamp lives (best effort: they may have walked off).
    request(
      stamp.peer.id,
      'minted',
      JSON.stringify(stamp.proof ? { proof: stamp.proof, url } : {}),
    ).catch(() => {});
  } catch (err) {
    console.warn('mint failed; will retry', err);
    save({ ...stamp, status: 'pending' });
  }
}

/** Initiator: ask the peer to confirm, co-sign, then mint. */
export async function proposeMeet(peerId: string): Promise<Stamp> {
  const ask = { walletA: myWallet(), ts: Date.now() };
  const reply = JSON.parse(
    await request(peerId, 'meet', JSON.stringify(ask), 60_000),
  ) as {
    payload: MeetPayload;
    pubB: string;
    sigB: string;
  };
  const p = reply.payload;
  // They may only add their own wallet; everything else must be what I proposed.
  if (
    p.a !== myAddress() ||
    p.b !== peerId ||
    p.walletA !== ask.walletA ||
    p.ts !== ask.ts
  ) {
    throw new Error('they returned a different payload');
  }
  const proof: MeetProof = {
    payload: p,
    pubA: await pub(),
    pubB: reply.pubB,
    sigA: await sign(p),
    sigB: reply.sigB,
  };
  if (!verifyMeet(proof)) throw new Error('their signature did not verify');
  const stamp: Stamp = {
    id: proof.sigB,
    peer: peerInfo(peerId),
    payload: p,
    proof,
    status: 'pending',
  };
  save(stamp);
  void mint(stamp);
  return stamp;
}

/** Re-try mints that failed while offline. */
export const retryPendingMints = () =>
  load()
    .filter(s => s.proof && s.status === 'pending')
    .forEach(mint);

// ---- confirmer side ----------------------------------------------------------

type Ask = { from: string; resolve: (ok: boolean) => void };
let asking: Ask | undefined;
const listeners = new Set<() => void>();
const setAsking = (a: Ask | undefined) => {
  asking = a;
  listeners.forEach(l => l());
};

handle('meet', async (body, sender) => {
  const { walletA, ts } = JSON.parse(body) as { walletA: string; ts: number };
  if (Math.abs(Date.now() - ts) > 120_000) throw new Error('stale request');
  Haptics.trigger('notificationWarning');
  const ok = await new Promise<boolean>(resolve => {
    setAsking({ from: sender, resolve });
    setTimeout(() => resolve(false), 55_000);
  });
  setAsking(undefined);
  if (!ok) throw new Error('declined');
  const payload: MeetPayload = {
    a: sender,
    b: myAddress(),
    walletA,
    walletB: myWallet(),
    ts,
  };
  const sigB = await sign(payload);
  save({ id: sigB, peer: peerInfo(sender), payload, status: 'pending' });
  return JSON.stringify({ payload, pubB: await pub(), sigB });
});

handle('minted', body => {
  const { proof, url } = JSON.parse(body) as {
    proof?: MeetProof;
    url?: string;
  };
  const mine = load().find(s => s.id === proof?.sigB);
  // Only accept a completed proof for a stamp I co-signed.
  if (
    mine &&
    proof &&
    url &&
    proof.payload.b === myAddress() &&
    verifyMeet(proof) &&
    addressOf(proof.pubB) === myAddress()
  ) {
    save({ ...mine, proof, status: 'minted', url });
    Haptics.trigger('notificationSuccess');
  }
  return 'ok';
});

export function MeetPrompt() {
  const a = useSyncExternalStore(
    l => (listeners.add(l), () => listeners.delete(l)),
    () => asking,
  );
  const insets = useSafeAreaInsets();
  useEffect(() => () => asking?.resolve(false), []);
  if (!a) return null;
  const p = cachedProfile(a.from);
  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={s.backdrop}>
      <Animated.View
        entering={ZoomIn.springify()}
        style={[s.sheet, { marginBottom: insets.bottom + 16 }]}
      >
        <Avatar
          name={p?.name ?? '?'}
          avatar={p?.avatar}
          size={80}
          category={p?.category}
        />
        <Text style={[T.title, { textAlign: 'center', fontSize: 26 }]}>
          {p?.name ?? 'Someone'} says you just met
        </Text>
        <Text style={[T.body, { color: C.muted, textAlign: 'center' }]}>
          Confirm to mint a proof-of-meet stamp on Base, signed by both of you.
        </Text>
        <Button
          style={{ alignSelf: 'stretch' }}
          title="Confirm & mint"
          onPress={() => a.resolve(true)}
        />
        <Button
          style={{ alignSelf: 'stretch' }}
          title="Not now"
          variant="outline"
          onPress={() => a.resolve(false)}
        />
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
    zIndex: 200,
  },
  sheet: {
    marginHorizontal: 12,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.lineStrong,
    borderRadius: 24,
    padding: 18,
    gap: 12,
    alignItems: 'center',
  },
});
