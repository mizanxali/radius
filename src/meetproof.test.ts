import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ed25519 } from '@noble/curves/ed25519.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  addressOf,
  meetMessage,
  noWallet,
  verifyMeet,
  type MeetPayload,
} from './meetproof.ts';

// Captured from a real device: SDK identity key, its off1 address, and
// signDataBytes("radius-test").
const DEVICE = {
  pub: '248d47f0acfc0ad4d37deeaf325a6ed15164c0fa5ba2dedb6a1fef2af36f755b',
  address: 'off1qyeulw2ld6eh7fhax0fdnd240s3mwacyks6jhj7q',
  sig: '5b5e266f395f6ca61669ec2c6162942e60bc066561d080a905c2a17c0d5531e96d70309ebf09f17fbfd3f8adaba478fe69805644bf60c22d433cb6afdfa2c20d',
};

test('address derivation and signatures match the SDK', () => {
  assert.equal(addressOf(DEVICE.pub), DEVICE.address);
  assert.ok(
    ed25519.verify(
      hexToBytes(DEVICE.sig),
      utf8ToBytes('radius-test'),
      hexToBytes(DEVICE.pub),
    ),
  );
});

const key = () => {
  const { secretKey, publicKey } = ed25519.keygen();
  return {
    secretKey,
    pub: bytesToHex(publicKey),
    addr: addressOf(bytesToHex(publicKey)),
  };
};

test('meet proof needs both real signatures over the same payload', () => {
  const A = key();
  const B = key();
  const now = Date.now();
  const payload: MeetPayload = {
    a: A.addr,
    b: B.addr,
    walletA: '0x' + 'ab'.repeat(20),
    walletB: noWallet,
    ts: now,
  };
  const sign = (k: typeof A, p: MeetPayload) =>
    bytesToHex(ed25519.sign(meetMessage(p), k.secretKey));
  const proof = {
    payload,
    pubA: A.pub,
    pubB: B.pub,
    sigA: sign(A, payload),
    sigB: sign(B, payload),
  };

  assert.equal(verifyMeet(proof, undefined, now), true);
  assert.equal(
    verifyMeet({ ...proof, sigB: proof.sigA }, undefined, now),
    false,
    'A cannot sign for B',
  );
  const tampered = { ...payload, walletB: '0x' + 'cd'.repeat(20) };
  assert.equal(
    verifyMeet({ ...proof, payload: tampered }, undefined, now),
    false,
    'wallets are signed',
  );
  const C = key();
  assert.equal(
    verifyMeet({ ...proof, pubB: C.pub }, undefined, now),
    false,
    'key must own the address',
  );
  assert.equal(
    verifyMeet(proof, undefined, now + 8 * 24 * 3600_000),
    false,
    'stale proofs rejected',
  );
});
