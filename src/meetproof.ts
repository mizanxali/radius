// Proof-of-meet: both people sign one payload with their Radius (SDK) identity
// keys. Pure, so the app and the Worker share it and node can test it.
import { ed25519 } from '@noble/curves/ed25519.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { bech32m } from '@scure/base';

const ZERO = '0x0000000000000000000000000000000000000000';

export type MeetPayload = {
  a: string; // initiator's off1 address
  b: string; // confirmer's off1 address
  walletA: string; // verified EVM wallet or zero address
  walletB: string;
  ts: number; // ms
};

/** Signed proof: the payload's canonical string signed by both identity keys (hex). */
export type MeetProof = {
  payload: MeetPayload;
  pubA: string;
  pubB: string;
  sigA: string;
  sigB: string;
};

export const noWallet = ZERO;

/** Canonical bytes both sides sign. Field order is fixed; never JSON. */
export const meetMessage = (p: MeetPayload) =>
  utf8ToBytes(
    `radius-meet:v1|${p.a}|${
      p.b
    }|${p.walletA.toLowerCase()}|${p.walletB.toLowerCase()}|${p.ts}`,
  );

/** The SDK's self-certifying address: bech32m("off", 0x01 || SHA-256(pub)[0:20]). */
export function addressOf(pubHex: string) {
  const pub = hexToBytes(pubHex);
  if (pub.length !== 32) throw new Error('bad public key');
  const body = new Uint8Array([1, ...sha256(pub).slice(0, 20)]);
  return bech32m.encode('off', bech32m.toWords(body));
}

const EVM = /^0x[0-9a-fA-F]{40}$/;

/** True when both keys own their addresses and both signed this exact payload. */
export function verifyMeet(
  m: MeetProof,
  maxAgeMs = 7 * 24 * 3600_000,
  now = Date.now(),
): boolean {
  try {
    const p = m.payload;
    if (p.a === p.b || !EVM.test(p.walletA) || !EVM.test(p.walletB))
      return false;
    if (!(p.ts <= now + 60_000 && now - p.ts <= maxAgeMs)) return false;
    if (addressOf(m.pubA) !== p.a || addressOf(m.pubB) !== p.b) return false;
    const msg = meetMessage(p);
    return (
      ed25519.verify(hexToBytes(m.sigA), msg, hexToBytes(m.pubA)) &&
      ed25519.verify(hexToBytes(m.sigB), msg, hexToBytes(m.pubB))
    );
  } catch {
    return false;
  }
}
