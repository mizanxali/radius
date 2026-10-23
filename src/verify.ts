// Wallet-ownership proofs, checked on-device so a peer can verify another
// peer's wallets offline. Pure (no React Native imports) so node can test it.
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import { base58 } from '@scure/base';

export type Chain = 'evm' | 'solana';
export type WalletProof = {
  chain: Chain;
  address: string;
  sig: string;
  issuedAt: number;
};

/** Binds a wallet to a Radius identity, so a copied proof can't be claimed by someone else. */
export const proofMessage = (
  address: string,
  radiusId: string,
  issuedAt: number,
) =>
  `Radius verification\nWallet: ${address}\nRadius ID: ${radiusId}\nIssued: ${new Date(
    issuedAt,
  ).toISOString()}`;

function evmSigner(message: string, sigHex: string): string {
  const msg = utf8ToBytes(message);
  const digest = keccak_256(
    new Uint8Array([
      ...utf8ToBytes(`\x19Ethereum Signed Message:\n${msg.length}`),
      ...msg,
    ]),
  );
  const sig = hexToBytes(sigHex.replace(/^0x/, ''));
  if (sig.length !== 65) throw new Error('bad signature length');
  const v = sig[64] >= 27 ? sig[64] - 27 : sig[64];
  // noble's 'recovered' layout is [recovery, r, s]; Ethereum's is [r, s, v].
  const pub = secp256k1.recoverPublicKey(
    new Uint8Array([v, ...sig.slice(0, 64)]),
    digest,
    { prehash: false },
  );
  const uncompressed = secp256k1.Point.fromBytes(pub).toBytes(false);
  return '0x' + bytesToHex(keccak_256(uncompressed.slice(1)).slice(-20));
}

/**
 * True when `w.sig` is `w.address`'s signature over the proof message for
 * `radiusId`. EOAs only: smart-contract wallets (ERC-1271) need an RPC call.
 */
export function verifyWallet(w: WalletProof, radiusId: string): boolean {
  try {
    const message = proofMessage(w.address, radiusId, w.issuedAt);
    if (w.chain === 'evm')
      return evmSigner(message, w.sig) === w.address.toLowerCase();
    return ed25519.verify(
      base58.decode(w.sig),
      utf8ToBytes(message),
      base58.decode(w.address),
    );
  } catch {
    return false;
  }
}

export const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
