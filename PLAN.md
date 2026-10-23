# Radius — plan

> "i built the ultimate networking tool." See who's around you at ETHGlobal / Devcon / Breakpoint, let AI pick who's worth talking to, flex your bags, walk over, and mint proof you met.

## Locked decisions

| Area | Decision |
|---|---|
| App | Bare React Native 0.85 + TypeScript, iOS + Android (SDK ships no Expo plugin; mirrors Fernweh's setup) |
| Discovery + exchange | `@offline-protocol/mesh-sdk` — `neighbor_discovered` for proximity/RSSI, `MeshServices` for profile cards, request/response for everything else. No chat, no MLS sessions needed |
| Accounts | None. Identity = SDK `off1…` address. Profile lives on-device (MMKV) |
| Socials | Typed handles (X, Telegram, Farcaster, GitHub, LinkedIn) → deep links |
| Wallets | Signed verification: Reown AppKit (EVM + Solana). Signature binds wallet ↔ `off1` address, verified peer-side offline |
| Net worth | Zerion portfolio API (EVM chains + Solana) via the Worker |
| AI | Claude via Cloudflare Worker (`/match`, icebreakers included). Offline fallback: local tag-overlap ranking |
| Backend | One Cloudflare Worker: holds Claude/Zerion keys, relayer wallet, rate limits. No DB (KV cache only) |
| Connect action | Wave (mesh ping + haptic) + saved contacts. No in-app chat |
| Viral v1 | Net worth reveal, hot/cold finder, room leaderboard, AI icebreakers, proof-of-meet stamps |
| Stamps | On-chain EAS attestation on Base, gas sponsored by the Worker's relayer |
| Demo | Hidden demo mode seeds ~15 fake attendees beside the real BLE peer(s) |

## Demo script (what we're building toward)

1. Phone A (iPhone) and B (Samsung) open Radius → radar pulses, B's avatar flies in from the edge.
2. Room fills (demo mode). AI Match tab: "Talk to these 3 first", each with a one-line why + icebreaker.
3. Tap B → profile with animated net-worth counter rolling up + verified wallet badges.
4. "Find them" → hot/cold finder, haptics speed up as A walks toward B.
5. Wave → B's screen lights up. Both tap "We met" → stamp mints on Base, confetti, easscan link.
6. Room tab: "$48.2M in this room", 🐋 leaderboard, builders vs VCs vs degens.

## Architecture

```
┌──────── phone ────────┐      BLE / WiFi Direct mesh      ┌──────── phone ────────┐
│ Radius RN app         │ ◄── service radius.v1 ────────► │ Radius RN app         │
│  mesh-sdk             │     card (capabilities)         │                       │
│  MMKV (profile,       │     req/resp: profile|wave|meet │                       │
│   peers, stamps)      │                                 │                       │
└─────────┬─────────────┘                                 └───────────────────────┘
          │ HTTPS (when online)
┌─────────▼──────────────── Cloudflare Worker ────────────────────────────────────┐
│ POST /networth  {wallets+sigs} → Zerion, ENS/SNS names, KV cache 10m           │
│ POST /match     {me, others[]}  → Claude, structured ranked output             │
│ POST /attest    {meet payload w/ both sigs} → EAS.attest on Base (relayer)     │
│ Rate limit per IP + per off1; verifies sigs before spending money              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Mesh protocol (one service: `radius.v1`)

- **Card** — `registerService('radius.v1', '1', capabilities)`, re-registered on profile edit. Compact string map (<1 KB): `n` name, `r` role, `c` company, `cat` category, `lf`/`of` looking-for/offering tag ids, `nw` net worth (rounded USD), `wv` verified-wallet flag, `av` avatar hash. Discovery is signed plaintext — public info only.
- **Discovery loop** — `discoverServices('radius.v1')` on every `neighbor_discovered` and every 15 s in foreground. `service_discovered.hop_count` → "right here" (0) vs "in the room" (1–3). Peers go stale after 2 min unseen.
- **Requests** (`sendServiceRequest`, method name):
  - `profile` → full profile JSON: bio, building, socials, wallets + ownership sigs, 256 px avatar (base64). Cached by `av` hash.
  - `wave` → receiver gets in-app banner + haptic; responds `ok`.
  - `meet` → carries A's signed meet payload; B's user confirms → response carries B's sig.
- Proximity/RSSI: `neighbor_discovered` (local transports only, case-insensitive — see Fernweh `meshDiscovery.utils.ts`) + poll `getTopology()` link RSSI ~1 Hz for the finder.

### Profile model

```ts
type Profile = {
  id: string;             // off1… address
  name: string; avatar?: string; role: string; company?: string;
  category: 'builder'|'founder'|'investor'|'designer'|'researcher'|'bd'|'degen';
  bio: string; building: string;          // "what I'm working on" — main AI input
  lookingFor: TagId[]; offering: TagId[]; // fixed list: investors, cofounder, devs, designers, users, hiring, job, grants, partnerships, alpha, frens
  socials: Partial<Record<'x'|'telegram'|'farcaster'|'github'|'linkedin', string>>;
  wallets: { chain: 'evm'|'solana'; address: string; sig: string; issuedAt: number }[];
  netWorthUsd?: number; netWorthAt?: number; hideExactNetWorth?: boolean; // tier-only mode (🦐→🐋)
};
```

Wallet sig message: `Radius verification\nWallet: <addr>\nRadius ID: <off1>\nIssued: <iso>`. Receivers verify locally (viem `verifyMessage` / tweetnacl) and check `Radius ID` = sender's `off1`, so a copied wallet can't be claimed. Smart-contract wallets (ERC-1271) fall back to Worker verification.

### Proof-of-meet

Payload `{a, b (off1), aWallet, bWallet, event?, ts}` signed by each side's SDK identity key (`signDataBytes`) — instant, no wallet popup; wallet↔off1 binding is already proven. Either phone (whoever's online first) posts to `/attest`; Worker verifies both sigs, dedupes, attests via EAS schema `(address a, address b, string offA, string offB, bytes sigA, bytes sigB, uint64 ts)` on Base. Offline → stamp shows "pending", mints on reconnect. Stamps tab = collection with easscan links.

### AI

- `/match`: my full profile + nearby cards/bios → Claude structured output `[{id, score, reason, icebreaker}]`, top 5. Re-run when the room changes by >20 % or on pull-to-refresh. Cached per room snapshot.
- Offline: score = overlap(my.lookingFor, their.offering) + overlap(their.lookingFor, my.offering) + same-category bonus.

## Screens (bottom tabs)

1. **Radar** — animated radar (reanimated + svg), avatars placed by RSSI/hop, list below. Tap → Person sheet.
2. **Matches** — AI top picks with reasons + icebreakers; "why" expands.
3. **Room** — net worth total ticker, 🐋 leaderboard, category donut, top "looking for".
4. **Me** — profile, edit, wallets, stamps collection.
- **Person sheet** — profile, net-worth roll-up, socials, Wave / Find / We met.
- **Finder** — full-screen pulse whose size/colour/haptic rate tracks smoothed RSSI.
- **Onboarding** — photo, name/role/company, building, tags, socials, connect wallets (skippable), BLE permission.

Visual direction: dark base, saturated gradient accents, big bold numbers, physics-y motion, haptics everywhere. Dedicated design pass in M6.

## Repo layout

```
radius/          RN app (src/{screens,components,mesh,profile,wallets,ai,demo,theme})
radius/worker/   Cloudflare Worker (wrangler)
```

## Milestones

- **M0 — spikes (done):** RN 0.88 app, SDK 0.30.0, iPhone 16 ↔ Samsung M17 over BLE. Findings:
  - Discovery both ways in seconds; ~950 B capabilities card arrives intact (`hop_count` 0).
  - Service response cap is **64 KiB** (128 KiB rejected). BLE throughput: 4 KB 0.8 s, 16 KB 1.6 s, 64 KB 4.5 s → avatar ≤ 12 KB.
  - `neighbor_discovered` fires once and `getTopology()` links carry no RSSI → patched the SDK BLE bridges (`patches/`) to emit a `peer_rssi` diagnostic (~1.5–4 Hz) named by address or by advertised node hash; Android now puts its node hash in the scan response as 0xFFFF manufacturer data. Upstream this to the SDK.
  - The bridges derive the mesh node id from `profile`, so it is random per install (a constant made every phone the same node).
  - `localAddress()` needs MLS storage open → encryption `enabled` with `autoKeyExchange: false`.
  - Reown AppKit spike moved to the start of M2.
- **M1 — profile + radar (done):** onboarding, MMKV, card registration/discovery, `profile` request, Radar + Person sheet.
- **M2 — wallets + net worth (built):** AppKit connect + sign, local verification, Worker `/networth`, card `nw`, tier display.
- **M3 — AI (built):** `/match` (with icebreakers), offline fallback, Matches tab.
- **M4 — viral interactions (built):** wave, finder, Room tab.
- **M5 — stamps (built):** EAS schema registered, relayer funded, `meet` flow, `/attest`, Stamps UI.
- **M6 — demo + polish:** demo mode seed, design pass, two-device run (iPhone + Samsung), record.

## Risks

- **RSSI rate** — if `getTopology()` RSSI only updates on discovery, add a periodic RSSI read/emit to the SDK BLE managers (we own the SDK).
- **iOS background BLE** is throttled — demo runs foregrounded; background discovery is best-effort.
- **Worker cost abuse** — Claude/Zerion/gas behind rate limits + signature checks; relayer holds a small balance.
- **License** — mesh-sdk is AGPL-3.0 or commercial; Radius must be AGPL or covered by a commercial license.

## Out of scope (v1)

Chat, accounts/cloud sync, OAuth-verified socials, event check-in/ticket gating, push notifications, web app.
