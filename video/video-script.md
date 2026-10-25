# Radius launch video: script

This describes the video as built in `src/` (composition `Launch`). Times inside a beat are seconds from the beat's start.

**Length:** 2:16 (136.2 s). **Format:** 16:9, 1920×1080, 60 fps.
**Sound:** "Hackbeat" by Kevin MacLeod as the music bed, with UI sound effects on the frame of the visual event that causes them (see the sound palette below). The captions tell the whole story, so it works muted.
**Look:** mock UI rebuilt from the app's own tokens, fonts and icons, not screen-captured. A black phone frame sits in the centre of a dark, slow-moving gradient wallpaper. Type is Cabinet Grotesk, white on black. Colour appears only on avatars, icons and dots, as in the app.
**Touch:** a soft white touch dot moves on eased paths. Each tap presses the dot, throws a ripple and plays a click.
**Camera:** the frame never stops moving. A slow Ken Burns drift runs under everything, and punch-ins follow the action Screen Studio-style.
**Cast:** demo-mode attendees (same ids as `src/demo.ts`, so the DiceBear avatars match the app). You are **Sam Okafor, Founder · Driftwood** (🐋, $12.48M). The room includes Priya Raman (General Partner, Lattice Ventures), Leo Martins (Protocol Engineer, Zephyr Labs) and Hana Sato (Product Designer).

### Caption band

- **Position:** the bottom 20% of the frame, fixed and unaffected by the camera.
- **Scrim:** a black gradient behind the band, up to 70%, so white text stays readable over light UI.
- **Two lines, centred:** the title in `F.bold` (60 px) and a description line in regular weight (36 px, 80% white).
- **Description lines:** each feature has two to five lines, each with its own start time. A line types in at about 45 characters per second and fades out 0.2 s before the next one starts, so the description follows what the phone is doing.
- **Framing rule:** the band covers the bottom of the phone during punch-ins, so each punch-in is aimed so the action sits just above the band (about 110 px above the frame centre). When the target is low on the phone, the camera moves down so the phone rides up.

### Sound palette

| Sound | Plays on |
|-------|----------|
| **Tap** (soft click) | Every touch-dot tap, each AI match card landing and each Finder step. |
| **Key clicks** | Each character typed (website, bio, X handle, note) and each icebreaker word. A quieter tap, varied in volume. |
| **Whoosh** | Something moving: a filter dimming the room, a sheet sliding up, a wave sent or sent back, the countersign arc, the share sheet, phones leaving. |
| **Chime** | Only the two wave notifications landing. |
| **Toggle** | The wallet verifying and the **Show exact amount** switch. |

**Music:** quiet under the cold open, full on "tool", ducked about 3 dB under wave back and the stamp mint, thinning as the phone drops and silent on the final cut to black. Credit it wherever the video is posted: `Music: "Hackbeat" by Kevin MacLeod (incompetech.com), licensed under CC BY 4.0`.

### The repeating feature beat

1. **0.0 s:** the title lands in big type, centred over the phone. The phone dims to 40%.
2. **0.6 s:** the title shrinks and glides down into the caption band (0.5 s). The phone undims and the camera punches in on the action (1.6–1.7×, 0.5 s). The first description line types in at 0.85 s.
3. **The feature plays out**, with a hold after every change so the screen can be read, and the description lines change as it goes.
4. **0.5 s before the end:** the camera punches out to the centred phone, the caption fades down and out, and the next title lands straight away.

The phone's screen content hard-cuts between beats, so the video never animates between tabs.

---

## 0:00–0:04 · Cold open

**Screen:** pure black. Kinetic type, centred, 128 px, one word at a time:

> **the** (0.4) · **ultimate** (0.9) · **networking** (1.4) · **tool** (2.0)

Each word snaps up from a 12 px offset with a blur-to-sharp. At 3.0 s the line shrinks and fades up and out, and the black fades into the wallpaper by 4.0 s.

## 0:04–0:07 · Phone enters

The phone slides up from below the frame with a spring and a little overshoot (0.9 s). It's open on **Radar** in demo mode: avatars pop onto the rings 0.1 s apart from 0.8 s, and the sweep turns. The camera eases in from 0.94× to 1×.

**Caption band:** `RADIUS`, fading out as the first title lands.

**SFX:** a whoosh as the phone slides up.

---

## 0:07–0:18 · 1. Everyone nearby (11 s)

**Phone:** the radar fills the frame (1.6×). Avatars drift closer and further as the signal changes. At 4.6 the dot taps **Good fit**, which dims the room and leaves Priya, Leo and Hana lit (**3 of 15**). At 7.0 it taps Priya, and her pass slides up (7.2). From 8.6 the pass scrolls up past **Building**, **Looking for** and **Can offer**.

| At | Description |
|----|-------------|
| 0.85 | Placed by Bluetooth signal strength. No accounts, no Wi-Fi. |
| 4.2 | Filter the room by role, or just the people who fit you. |
| 7.0 | Tap anyone for their pass: what they build, need and offer. |

## 0:18–0:31 · 2. AI reads the room (13 s)

**Phone:** the **AI match** tab and its **Talk to these first** list. From 1.0 the cards cascade in, each with its one-line reason. The list scrolls down (3.0) and back to Leo (4.0–4.8). At 5.2 the dot taps **Write an icebreaker** on Leo, which shows **Writing an icebreaker…** with a shimmer. At 6.6 the result types out word by word under **Say this**, and the camera pushes in to 2.1× on it.

- Priya: "Priya writes first checks into consumer apps, and Driftwood is raising its pre-seed."
- Leo: "Leo wants a co-founder and you need devs. Zephyr's cheap proofs fit your shared wallets."
- Hana: "Hana designs seedless wallet onboarding, the exact flow Driftwood needs next."
- Icebreaker: "Leo, could Zephyr prove a group wallet paid its share without an indexer? That's Driftwood's whole problem."

| At | Description |
|----|-------------|
| 0.85 | AI ranks the room for you: who has what you need, and who needs what you offer. |
| 4.6 | Not sure what to say? Tap for an AI icebreaker. |
| 6.8 | Written for that one person, from both of your profiles. |
| 9.6 | Offline? Radius still matches you on shared interests. |

## 0:31–0:46 · 3. Build your pass (15 s)

**Phone:** the full **Edit pass** form, as in the app's ProfileEditor.
1. **New avatar** is tapped at 1.8 and 2.5. The avatar on the pass card changes with a small bump and settles on Sam's.
2. The form scrolls to **I'm a** (3.2). At 4.3 Sam switches from Builder to Founder, and the pass card's tag and glow change from blue to orange.
3. At 5.0 Sam taps **Bio**, the keyboard comes up, and "ex-Uber PM, 2x hackathon winner" types in from 5.5.
4. The form scrolls to the tag pickers (7.9). **Looking for:** Investors, Devs and Designers light up purple (8.8, 9.2, 9.6). **I can offer:** Users and Partnerships light up green (10.2, 10.6).
5. The form scrolls to **Socials** (11.0). At 11.8 Sam taps X and types `samokafor`.

| At | Description |
|----|-------------|
| 0.85 | Your pass is how people find you. Set it up in a minute. |
| 1.6 | Add a photo, or roll a new avatar. |
| 3.8 | Say what you are, what you're building, and a bit about you. |
| 7.9 | Pick what you're looking for, and what you can offer. |
| 11.0 | Add your socials so people can follow up later. |

## 0:46–0:58 · 4. No more pitch decks (12 s)

**Phone:** the same Edit pass form. At 1.8 the dot taps **Website**. The keyboard comes up, the form scrolls the field above it, and `driftwood.xyz` types in from 2.3 while the camera pushes in to 2×. The keyboard drops (4.3), the form scrolls to the bottom and **Save** is tapped (5.3). Hard cut to **My pass** (5.6): "Claude is reading driftwood.xyz to summarise what you do…", then the **AI summary** block fades in with its label at 6.8.

| At | Description |
|----|-------------|
| 0.85 | Add your website to your pass. |
| 5.6 | AI reads the site and sums up what you do. |
| 8.5 | Labelled as AI on your pass, and it sharpens your matches. |

## 0:58–1:10 · 5. Flex your bags, provably (12 s)

**Phone:** My pass, scrolled to **Flex your bags** (1.7×). At 1.8 the dot taps **Connect wallet**, and the button shows **Check your wallet…** At 3.6 **Ethereum · verified** ticks in, and the net worth counts up from $0 to $12,480,215.60. At 7.3 Sam switches **Show exact amount** off, and the number morphs into **🐋 Whale**.

**Hero cutaway (9.4–11.0):** a dark backdrop with the tiers popping in one after another: 🦐 Shrimp, 🦀 Crab, 🐟 Fish, 🐬 Dolphin, 🦈 Shark, 🐋 Whale (biggest, with a glow). The caption stays.

| At | Description |
|----|-------------|
| 0.85 | Connect a wallet and sign once to prove it's yours. |
| 3.6 | Your net worth lands on your pass, verified. |
| 6.8 | Rather keep the number private? Show your tier instead. |
| 9.4 | From shrimp to whale. |

## 1:10–1:22 · 6. Know the room (12 s)

**Phone:** **The room** tab. **People in the room** counts to 16, and the category bars grow in with their counts (Founder leads, in orange). At 3.8 it scrolls to **Net worth in the room**, which counts up to $93.1M while the leaderboard rows stagger in. At 7.6 it scrolls on to **The room wants** and **The room offers**.

| At | Description |
|----|-------------|
| 0.85 | How many people are here, and the mix of roles. |
| 4.0 | Total verified net worth, with a leaderboard. |
| 7.8 | What the room is looking for, and what it can offer. |

## 1:22–1:32 · 7. Say hi without saying hi (10 s)

**Split:** instead of punching in, Sam's phone shrinks to 0.9× and slides left, and Priya's phone slides in from the right with an overshoot. Both sit above the band.
- Left (Sam, on Priya's pass): the dot taps **Wave** at 2.8.
- Right (Priya, on Sam's pass): the phone shakes and the banner drops at 3.15: **Sam Okafor waved at you**. Priya's dot taps **Wave back** at 5.4.
- Left: **Priya Raman waved at you** lands at 5.7 with a smaller shake.
- The camera pushes in slowly to the end. The music is ducked around wave back.

Both phones stay on screen for the next two beats.

| At | Description |
|----|-------------|
| 0.85 | One tap buzzes their phone. No numbers, no handles. |
| 3.2 | They see who waved, wherever they are in the room. |
| 5.4 | And wave back with one tap. |

## 1:32–1:43 · 8. Hot or cold (11 s)

**Split:** Sam's phone shows the **Finder** for Priya. Over the beat the phones slide toward each other until they touch. The Finder steps through the app's order:

| At | Label | Signal |
|----|-------|--------|
| 1.1 | Cold, keep moving | -86 dBm |
| 3.4 | Getting warmer | -74 dBm |
| 5.7 | Warmer | -64 dBm |
| 8.0 | Right here | -44 dBm |

The pulse grows and speeds up, and shifts from blue through purple to orange. Each step brings a tap, a camera shake and a punch-in on Sam's Finder (1.35×). The camera punches out between steps, so the gap closing between the phones is visible.

| At | Description |
|----|-------------|
| 0.85 | Lost them in the crowd? Follow their Bluetooth signal. |
| 5.7 | Warmer and faster as you close in, until you're face to face. |

## 1:43–1:55 · 9. Proof you met (12 s)

**Split:** the two phones touch in the centre.
1. At 1.8 Sam taps **We met**. Priya's phone shows **Sam Okafor says you just met**, and Priya taps **Confirm & mint** at 4.0.
2. A line of light arcs between the phones (4.15–4.8, the countersign).
3. Both show **You met · minting your stamp…** (4.8), then **You met · stamp minted on Base** at the same moment (6.6). The music is ducked here.

**Hero cutaway (7.6–9.8):** both avatars with a handshake badge, **Stamp minted on Base**, and the EAS UID typing in underneath.

Then Priya's phone slides out to the right (10.0), and Sam's grows back to full size in the centre.

| At | Description |
|----|-------------|
| 0.85 | Tap We met, and they confirm on their phone. |
| 4.1 | Both phones sign the meeting with their own keys. |
| 6.6 | Minted as an attestation on Base. Radius covers the gas. |

## 1:55–2:08 · 10. Remember everyone (13 s)

**Phone:** on Priya's pass, the dot taps **Private note** (1.6). The keyboard comes up and `pre-seed, follow up after demo day` types in from 2.1. Hard cut (5.5) to **My pass**, **People you've met**: Priya and Leo with **On Base** stamps, and Hana with a note. At 8.2 the dot taps **Export**, and the share sheet slides up with the plain-text list showing. The camera moves down so the list sits above the band.

| At | Description |
|----|-------------|
| 0.85 | Jot a private note. It never leaves your phone. |
| 5.5 | Everyone you met, with stamps and notes, in one list. |
| 8.2 | Export them all as plain text, anywhere you like. |

---

## 2:08–2:09 · Exit

The phone slides down off the frame (ease-in, 0.2–0.8 s) with a quiet whoosh. Only the wallpaper remains, and the music thins out.

## 2:09–2:16 · Close

1. **built for** lands, 120 px (0.2).
2. Under it, one place at a time cycles through in big grey type, 0.5 s each from 0.7: events → conferences → parties → meetups → hacker houses.
3. At 3.3 the cycling word collapses into one smaller line: `events · conferences · parties · meetups · hacker houses`.
4. **on** (4.1) and **Offline Protocol** (4.45) land big underneath.

The frame holds, then cuts to black at 6.7 s as the music fades out.

---

## Caption sheet

| # | Title | Description lines |
|---|-------|-------------------|
| 1 | Everyone nearby | Placed by Bluetooth signal strength. No accounts, no Wi-Fi. / Filter the room by role, or just the people who fit you. / Tap anyone for their pass: what they build, need and offer. |
| 2 | AI reads the room | AI ranks the room for you: who has what you need, and who needs what you offer. / Not sure what to say? Tap for an AI icebreaker. / Written for that one person, from both of your profiles. / Offline? Radius still matches you on shared interests. |
| 3 | Build your pass | Your pass is how people find you. Set it up in a minute. / Add a photo, or roll a new avatar. / Say what you are, what you're building, and a bit about you. / Pick what you're looking for, and what you can offer. / Add your socials so people can follow up later. |
| 4 | No more pitch decks | Add your website to your pass. / AI reads the site and sums up what you do. / Labelled as AI on your pass, and it sharpens your matches. |
| 5 | Flex your bags, provably | Connect a wallet and sign once to prove it's yours. / Your net worth lands on your pass, verified. / Rather keep the number private? Show your tier instead. / From shrimp to whale. |
| 6 | Know the room | How many people are here, and the mix of roles. / Total verified net worth, with a leaderboard. / What the room is looking for, and what it can offer. |
| 7 | Say hi without saying hi | One tap buzzes their phone. No numbers, no handles. / They see who waved, wherever they are in the room. / And wave back with one tap. |
| 8 | Hot or cold | Lost them in the crowd? Follow their Bluetooth signal. / Warmer and faster as you close in, until you're face to face. |
| 9 | Proof you met | Tap We met, and they confirm on their phone. / Both phones sign the meeting with their own keys. / Minted as an attestation on Base. Radius covers the gas. |
| 10 | Remember everyone | Jot a private note. It never leaves your phone. / Everyone you met, with stamps and notes, in one list. / Export them all as plain text, anywhere you like. |

## Where it lives

- `src/Launch.tsx`: the timeline (scene, caption, music and type tracks), the caption lines and the music volume envelope.
- `src/scenes.tsx`: each beat's camera keyframes, taps, typing and sound effects.
- `src/screens.tsx`: the mock app screens. `src/ui.tsx`: the phone, touch dot, keyboard and component kit. `src/type.tsx`: the wallpaper, drift, captions and kinetic type.
- `npm run dev` opens Studio. `npx remotion render Launch out/launch.mp4 --codec=h264 --crf=18` renders. The sound effects stream from `remotion.media`, so rendering needs internet.
