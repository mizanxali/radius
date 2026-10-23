// One-off: registers the Radius proof-of-meet schema on EAS and prints its UID.
//   RELAYER_KEY=0x… CHAIN=base-sepolia node scripts/register-schema.mjs
import { createPublicClient, createWalletClient, encodePacked, http, keccak256, zeroAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base, baseSepolia } from 'viem/chains';

const SCHEMA = 'address walletA,address walletB,string radiusA,string radiusB,bytes sigA,bytes sigB,uint64 metAt';
const REGISTRY = '0x4200000000000000000000000000000000000020';
const abi = [
  { type: 'function', name: 'register', stateMutability: 'nonpayable',
    inputs: [{ name: 'schema', type: 'string' }, { name: 'resolver', type: 'address' }, { name: 'revocable', type: 'bool' }],
    outputs: [{ type: 'bytes32' }] },
  { type: 'function', name: 'getSchema', stateMutability: 'view', inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [{ type: 'tuple', components: [{ name: 'uid', type: 'bytes32' }, { name: 'resolver', type: 'address' }, { name: 'revocable', type: 'bool' }, { name: 'schema', type: 'string' }] }] },
];

const chain = process.env.CHAIN === 'base' ? base : baseSepolia;
const account = privateKeyToAccount(process.env.RELAYER_KEY);
const reader = createPublicClient({ chain, transport: http() });
const uid = keccak256(encodePacked(['string', 'address', 'bool'], [SCHEMA, zeroAddress, false]));

const existing = await reader.readContract({ address: REGISTRY, abi, functionName: 'getSchema', args: [uid] });
if (existing.uid !== uid) {
  const wallet = createWalletClient({ account, chain, transport: http() });
  const hash = await wallet.writeContract({ address: REGISTRY, abi, functionName: 'register', args: [SCHEMA, zeroAddress, false] });
  await reader.waitForTransactionReceipt({ hash });
  console.log('registered in', hash);
}
console.log(`SCHEMA_UID=${uid} on ${chain.name}`);
