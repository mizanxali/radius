# Radius

React Native app for meeting the right people at web3 events (ETHGlobal, Devcon, Breakpoint). Phones find each other over Bluetooth with `@offline-protocol/mesh-sdk`; there are no accounts and no app server for discovery. A Cloudflare Worker in `worker/` holds the API keys for net worth (Zerion), AI matching (Claude) and proof-of-meet stamps (EAS on Base).

## Commands

```sh
npm install                 # also applies patches/ via patch-package
npm start                   # Metro
npm test                    # node --test src/*.test.ts (pure modules only)
npx tsc --noEmit && npm run lint
cd ios && pod install       # after native dependency changes

cd worker && npm run dev    # Worker on 0.0.0.0:8787, secrets from worker/.dev.vars
cd worker && npm run register-schema   # one-off EAS schema registration (needs RELAYER_KEY, CHAIN)
```

Android reaches Metro and the dev Worker through `adb reverse tcp:8081 tcp:8081` and `adb reverse tcp:8787 tcp:8787`. The iPhone reaches the Worker on the Metro host's LAN IP (`src/config.ts` derives it from the bundle URL). `node scripts/js-log.js <file>` streams JS logs from every attached phone through Metro.

## Layout

- `App.tsx`: native stack (Onboarding, Main tabs Radar/Matches/Room/Me, modals Person/Finder/EditProfile) plus the global `WaveBanner` and `MeetPrompt`.
- `src/mesh.ts`: SDK setup, MMKV `storage`, `onPeerRssi`. `src/peers.ts`: peer store, request/response over the `radius.v1` service, profile prefetch, `publishCard`, `bootMesh`.
- `src/profile.ts`, `verify.ts`, `match.ts`, `meetproof.ts`: pure logic with `*.test.ts` beside them. `meetproof.ts` is imported by the Worker too.
- `src/ai.ts`, `wallet.ts`, `wave.tsx`, `meet.tsx`, `demo.ts`: features. `src/screens/`: UI.
- `src/theme.ts` + `src/ui.tsx`: design tokens and the component kit. `PassCard.tsx`, `NetWorth.tsx`: shared pieces.
- `worker/src/index.ts` (routes, Zerion, rate limits), `ai.ts` (`/match`), `attest.ts` (EAS).

## How it works

- **Card:** each phone registers `radius.v1` with a small capabilities map (`n` name, `r` role, `c` company, `cat`, `lf`/`of` tags, `v` verified, `nw` net worth, `t` tier, `av` avatar hash, `nh` node hash). Public info only.
- **Requests** (`request`/`handle` in `peers.ts`): `profile` (full profile with a 256 px avatar), `wave`, `meet` (the other side confirms and countersigns), `minted` (tells the peer where its stamp lives).
- **Identity:** the SDK `off1…` address. The SDK derives its node id from `profile`, so Radius uses a random per-install `meshProfile` in MMKV. `localAddress()` only works once MLS storage is open, hence `encryption.enabled` with `autoKeyExchange: false`.
- **Wallets:** the wallet signs `proofMessage` binding it to the `off1` address. Peers verify locally and reject proofs naming another address.
- **Stamps:** both phones sign `meetMessage` with their SDK identity keys. Either phone posts the proof to `/attest`, and the relayer pays gas. Pending stamps retry on launch.
- **AI:** `/match` uses Claude with structured output. Profiles are untrusted input. When offline, `localMatches` ranks by tag overlap.
- **Demo mode:** long-press the empty top-right corner of Me. `src/demo.ts` puts 15 seeded attendees into the real peer store; they answer `profile` and `wave` in-process.

## Gotchas

- **SDK patch** (`patches/@offline-protocol+mesh-sdk+0.30.0.patch`): adds a `peer_rssi` diagnostic (iOS ~1.5 Hz, Android ~3–4 Hz) and puts Android's node hash in the scan response as `0xFFFF` manufacturer data. Drop it once the SDK ships live RSSI natively. `patch-package` can't regenerate this patch: diff by hand against a clean `npm pack` copy.
- **Service responses** cap at 64 KiB over BLE. Keep avatars at 256 px, quality 0.6.
- **Fonts:** Cabinet Grotesk is linked from `assets/fonts`. Pick the face with `fontFamily` (`F.bold`, …) and never set `fontWeight`, or Android substitutes a system font.
- **LinearGradient on iOS Fabric** doesn't lay out children. Use it only as an absolute-fill background.
- **Xcode 27:** the Podfile `post_install` raises pod deployment targets; keep it.
- **iOS relaunch:** iOS relaunches the app through BLE background restore after it's killed, so terminate it twice when stopping it.
- **Stale links:** after a phone's identity changes (data cleared), the other phone may hold a stale link until both apps restart.

## Conventions

- **Code:** TypeScript strict, Prettier, functional components, `useSyncExternalStore` stores instead of a state library.
- **UI:** black UI with white type and hairline borders (`C.line`/`C.lineStrong`). Colour goes only on avatars (`CAT_GRADIENT`), icons and dots (`CAT_COLOR`); use tokens, not hex.
- **Copy:** never guess pronouns from names in UI copy or prompts.
- **Secrets:** they live only in `worker/.dev.vars` (gitignored) or Worker secrets. `src/config.ts` holds public config only, such as the Reown project ID.
- **Git:** commit messages are all lowercase.

## Status

- **Chain:** stamps attest on Base Sepolia (`CHAIN`, `SCHEMA_UID` in `worker/wrangler.jsonc`).
- **Worker:** runs locally and isn't deployed yet. Production `WORKER_URL` is `https://radius.mizanalip786.workers.dev`.
- **Before mainnet:** register the schema on Base and fund the relayer there.
- **Licence:** mesh-sdk is AGPL-3.0, so Radius must be AGPL or covered by a commercial licence.
