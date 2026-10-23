// Mints a proof-of-meet as an EAS attestation on Base, gas paid by the relayer.
import {
  createPublicClient,
  createWalletClient,
  encodeAbiParameters,
  http,
  parseAbiParameters,
  parseEventLogs,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';
import { verifyMeet, type MeetProof } from '../../src/meetproof';

// OP-stack predeploys: same addresses on Base and Base Sepolia.
const EAS = '0x4200000000000000000000000000000000000021';
export const SCHEMA =
  'address walletA,address walletB,string radiusA,string radiusB,bytes sigA,bytes sigB,uint64 metAt';

const easAbi = [
  {
    type: 'function',
    name: 'attest',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'request',
        type: 'tuple',
        components: [
          { name: 'schema', type: 'bytes32' },
          {
            name: 'data',
            type: 'tuple',
            components: [
              { name: 'recipient', type: 'address' },
              { name: 'expirationTime', type: 'uint64' },
              { name: 'revocable', type: 'bool' },
              { name: 'refUID', type: 'bytes32' },
              { name: 'data', type: 'bytes' },
              { name: 'value', type: 'uint256' },
            ],
          },
        ],
      },
    ],
    outputs: [{ name: '', type: 'bytes32' }],
  },
  {
    type: 'event',
    name: 'Attested',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'attester', type: 'address', indexed: true },
      { name: 'uid', type: 'bytes32', indexed: false },
      { name: 'schemaUID', type: 'bytes32', indexed: true },
    ],
  },
] as const;

export type AttestEnv = {
  RELAYER_KEY: Hex;
  SCHEMA_UID: Hex;
  CHAIN: 'base' | 'base-sepolia';
};

export const explorer = (env: AttestEnv, uid: string) =>
  `https://${
    env.CHAIN === 'base' ? 'base' : 'base-sepolia'
  }.easscan.org/attestation/view/${uid}`;

export async function attest(env: AttestEnv, proof: MeetProof) {
  if (!verifyMeet(proof)) throw new BadProof();
  const chain = env.CHAIN === 'base' ? base : baseSepolia;
  const account = privateKeyToAccount(env.RELAYER_KEY);
  const wallet = createWalletClient({ account, chain, transport: http() });
  const reader = createPublicClient({ chain, transport: http() });
  const p = proof.payload;

  const data = encodeAbiParameters(parseAbiParameters(SCHEMA), [
    p.walletA as Hex,
    p.walletB as Hex,
    p.a,
    p.b,
    `0x${proof.sigA}`,
    `0x${proof.sigB}`,
    BigInt(p.ts),
  ]);
  const hash = await wallet.writeContract({
    address: EAS,
    abi: easAbi,
    functionName: 'attest',
    args: [
      {
        schema: env.SCHEMA_UID,
        data: {
          recipient: p.walletA as Hex, // zero address when A has no wallet
          expirationTime: 0n,
          revocable: false,
          refUID: `0x${'0'.repeat(64)}`,
          data,
          value: 0n,
        },
      },
    ],
  });
  const receipt = await reader.waitForTransactionReceipt({
    hash,
    timeout: 30_000,
  });
  const [log] = parseEventLogs({
    abi: easAbi,
    eventName: 'Attested',
    logs: receipt.logs,
  });
  if (!log) throw new Error('no Attested event');
  return { uid: log.args.uid, tx: hash, url: explorer(env, log.args.uid) };
}

export class BadProof extends Error {}
