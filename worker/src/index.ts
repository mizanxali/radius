// Radius backend: holds the API keys so the app ships keyless.
//   POST /networth  { wallets: [{ chain: 'evm'|'solana', address }] } → { usd, wallets: [{ address, usd }] }
//   POST /match     { me, others[] } → { matches: [{ id, score, reason, icebreaker }] }
//   POST /attest    MeetProof → { uid, tx, url }   (EAS on Base, relayer pays gas)
import Anthropic from '@anthropic-ai/sdk';
import { attest, BadProof, type AttestEnv } from './attest';
import type { MeetProof } from '../../src/meetproof';
import { match, MatchRequest } from './ai';

interface Env extends AttestEnv {
  ZERION_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  LIMITER: RateLimit;
  ATTEST_LIMITER: RateLimit;
}

type Wallet = { chain: 'evm' | 'solana'; address: string };

const EVM = /^0x[a-fA-F0-9]{40}$/;
const SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const CACHE_SECONDS = 600;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

async function walletUsd(
  w: Wallet,
  env: Env,
  ctx: ExecutionContext,
): Promise<number> {
  // DeFi positions are EVM-only on Zerion for now; Solana gets wallet holdings.
  const filter = w.chain === 'evm' ? 'no_filter' : 'only_simple';
  const url = `https://api.zerion.io/v1/wallets/${w.address}/portfolio?currency=usd&filter[positions]=${filter}`;
  const cacheKey = new Request(url);
  const cache = caches.default;
  let res = await cache.match(cacheKey);
  if (!res) {
    res = await fetch(url, {
      headers: {
        accept: 'application/json',
        authorization: `Basic ${btoa(`${env.ZERION_API_KEY}:`)}`,
      },
    });
    if (!res.ok) throw new Error(`zerion ${res.status}`);
    res = new Response(res.body, res);
    res.headers.set('cache-control', `public, max-age=${CACHE_SECONDS}`);
    ctx.waitUntil(cache.put(cacheKey, res.clone()));
  }
  const body = (await res.json()) as {
    data?: { attributes?: { total?: { positions?: number } } };
  };
  return body.data?.attributes?.total?.positions ?? 0;
}

async function networth(req: Request, env: Env, ctx: ExecutionContext) {
  const { wallets } = (await req.json()) as { wallets?: Wallet[] };
  if (!Array.isArray(wallets) || wallets.length === 0 || wallets.length > 5) {
    return json({ error: '1–5 wallets required' }, 400);
  }
  for (const w of wallets) {
    const ok =
      (w?.chain === 'evm' && EVM.test(w.address)) ||
      (w?.chain === 'solana' && SOL.test(w.address));
    if (!ok) return json({ error: `bad wallet ${String(w?.address)}` }, 400);
  }
  const values = await Promise.all(wallets.map(w => walletUsd(w, env, ctx)));
  return json({
    usd: values.reduce((a, b) => a + b, 0),
    wallets: wallets.map((w, i) => ({ address: w.address, usd: values[i] })),
  });
}

async function attestRoute(
  req: Request,
  env: Env,
  ctx: ExecutionContext,
  ip: string,
) {
  // Gas costs real money: a tighter limit than the rest of the API.
  if (!(await env.ATTEST_LIMITER.limit({ key: ip })).success)
    return json({ error: 'slow down' }, 429);
  const proof = (await req.json()) as MeetProof;
  // Both phones may post the same proof; mint it once.
  const key = new Request(
    `https://radius.internal/attest/${proof.sigA}${proof.sigB}`,
  );
  const done = await caches.default.match(key);
  if (done) return new Response(done.body, done);
  try {
    const res = json(await attest(env, proof));
    res.headers.set('cache-control', 'public, max-age=604800');
    ctx.waitUntil(caches.default.put(key, res.clone()));
    return res;
  } catch (err) {
    if (err instanceof BadProof) return json({ error: 'invalid proof' }, 400);
    throw err;
  }
}

export default {
  async fetch(req, env, ctx): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (req.method !== 'POST') return json({ ok: true, service: 'radius' });

    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
    if (!(await env.LIMITER.limit({ key: ip })).success)
      return json({ error: 'slow down' }, 429);

    try {
      if (pathname === '/networth') return await networth(req, env, ctx);
      if (pathname === '/attest') return await attestRoute(req, env, ctx, ip);
      if (pathname === '/match') {
        const body = MatchRequest.safeParse(await req.json());
        if (!body.success) return json({ error: body.error.message }, 400);
        const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
        return json(await match(client, body.data));
      }
      return json({ error: 'not found' }, 404);
    } catch (err) {
      console.error(pathname, err);
      return json({ error: 'upstream failed' }, 502);
    }
  },
} satisfies ExportedHandler<Env>;
