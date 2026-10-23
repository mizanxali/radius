// node --test src/verify.test.ts   (viem is the independent reference signer)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts';
import { ed25519 } from '@noble/curves/ed25519.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';
import { base58 } from '@scure/base';
import { proofMessage, verifyWallet } from './verify.ts';

const ME = 'off1qyzfj40pu6lvgncyjt6964lxrjm0d7ntqvwsn660';
const OTHER = 'off1q9h9nm4pfn67uuns995xcwrtdrghe8kmvvw86tj9';
const at = Date.UTC(2026, 9, 23);

test('evm personal_sign proof', async () => {
  const acct = privateKeyToAccount(generatePrivateKey());
  const sig = await acct.signMessage({
    message: proofMessage(acct.address, ME, at),
  });
  const w = { chain: 'evm' as const, address: acct.address, sig, issuedAt: at };
  assert.equal(verifyWallet(w, ME), true);
  assert.equal(
    verifyWallet(w, OTHER),
    false,
    'proof is bound to the radius id',
  );
  assert.equal(verifyWallet({ ...w, issuedAt: at + 1 }, ME), false);
  const stranger = privateKeyToAccount(generatePrivateKey()).address;
  assert.equal(
    verifyWallet({ ...w, address: stranger }, ME),
    false,
    'cannot claim another wallet',
  );
});

test('solana signMessage proof', () => {
  const { secretKey, publicKey } = ed25519.keygen();
  const address = base58.encode(publicKey);
  const sig = base58.encode(
    ed25519.sign(utf8ToBytes(proofMessage(address, ME, at)), secretKey),
  );
  const w = { chain: 'solana' as const, address, sig, issuedAt: at };
  assert.equal(verifyWallet(w, ME), true);
  assert.equal(verifyWallet(w, OTHER), false);
  assert.equal(verifyWallet({ ...w, sig: 'garbage' }, ME), false);
});
