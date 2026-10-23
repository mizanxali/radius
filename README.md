# Radius

See who's around you at a web3 event, let AI pick who's worth talking to, walk over, and mint proof you met.

Radius finds other people running the app over Bluetooth, phone to phone, with no accounts and no sign-up. It works in a packed hall with bad Wi-Fi; the internet is only needed for the extras (net worth, AI picks, onchain stamps).

## Features

- **Radar:** everyone nearby on a live radar, placed by Bluetooth signal strength. Tap anyone to see their pass: role, what they're building, what they're looking for and what they offer, and their socials.
- **AI match:** Claude reads the room and ranks the people most worth meeting for you, with a one-line reason and an icebreaker. Offline, it falls back to matching tags.
- **Verified net worth:** sign with an Ethereum or Solana wallet (via Reown) to put your portfolio value on your pass. Others verify the signature on their own phone, so nobody can claim a wallet that isn't theirs. You can show just your tier (🦐 to 🐋) instead of the amount.
- **The room:** total net worth in the room, a leaderboard, the category mix, and what the room wants and offers.
- **Wave:** a tap buzzes the other person's phone.
- **Finder:** a hot/cold screen that tracks the signal (with haptics) as you walk toward someone.
- **Proof of meet:** both phones sign that you met, and the stamp mints as an [EAS](https://attest.org) attestation on Base. Gas is paid by the backend. If you're offline it mints later.

## How it works

```
 phone ──── Bluetooth mesh (@offline-protocol/mesh-sdk) ──── phone
   │          card: name, role, tags, tier (public)
   │          requests: profile · wave · meet
   │
   └── HTTPS, when online ──► Cloudflare Worker (worker/)
                                /networth  Zerion portfolio
                                /match     Claude ranking + icebreakers
                                /attest    EAS attestation, relayer pays gas
```

- **Profiles** live on the phone (MMKV). Each phone advertises a small public card and serves the full profile on request.
- **Identity** is the mesh SDK's `off1…` address. Wallet proofs and meet stamps are signed against it.
- **Secrets** stay in the Worker; the app ships without keys.

## Stack

React Native 0.88 (TypeScript, bare), `@offline-protocol/mesh-sdk`, Reown AppKit (ethers + Solana), React Navigation, Reanimated, MMKV. The Worker uses Wrangler, the Anthropic SDK, viem and Zod.

## Running it

Needs Node ≥ 22.11, Xcode with CocoaPods, and Android Studio. Bluetooth discovery needs **real phones**: simulators can't see each other.

```sh
npm install
cd ios && pod install && cd ..
npm start
npm run ios       # or: npm run android
```

### Backend (optional for discovery, needed for net worth, AI and stamps)

```sh
cd worker
npm install
cat > .dev.vars <<'EOF'
ANTHROPIC_API_KEY=...
ZERION_API_KEY=...
RELAYER_KEY=0x...        # funded on the chain set in wrangler.jsonc (Base Sepolia by default)
EOF
npm run dev              # http://0.0.0.0:8787
```

In development the app finds the Worker on the same machine as Metro. Android needs both ports forwarded:

```sh
adb reverse tcp:8081 tcp:8081 && adb reverse tcp:8787 tcp:8787
```

To use your own EAS schema, register it once with `RELAYER_KEY=0x... CHAIN=base-sepolia npm run register-schema` and put the printed UID in `wrangler.jsonc`. Deploy with `npm run deploy` after setting the three secrets with `wrangler secret put`.

### Demo mode

Long-press the empty top-right corner of the **Me** tab to fill the room with 15 seeded attendees. They show up beside any real phones nearby. Long-press again to turn it off.

## Tests

```sh
npm test              # wallet proofs, meet proofs, matching
npx tsc --noEmit
npm run lint
```

## Project layout

```
App.tsx              navigation, global wave banner and meet prompt
src/
  mesh.ts peers.ts   mesh SDK setup, peer store, request/response
  profile.ts         profile model, card encoding, tiers
  verify.ts          wallet ownership proofs
  meetproof.ts       proof-of-meet signing (shared with the Worker)
  match.ts ai.ts     offline and AI matching
  wallet.ts          Reown AppKit, net worth
  wave.tsx meet.tsx  wave and stamps
  demo.ts            hidden demo mode
  theme.ts ui.tsx    design tokens and components
  screens/           Radar, Matches, Room, Me, Person, Finder, ProfileEditor
worker/              Cloudflare Worker
patches/             mesh SDK patch (live RSSI for the radar and finder)
```

## Licence

Radius depends on `@offline-protocol/mesh-sdk`, which is licensed AGPL-3.0-only (or commercially).
