import { Handshake } from "lucide-react";
import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PRIYA, SAM } from "./data";
import {
  BIO,
  EditorScreen,
  FinderScreen,
  MatchesScreen,
  MeetPrompt,
  MeScreen,
  PersonScreen,
  RadarScreen,
  radarPos,
  RoomScreen,
  ShareSheet,
  WaveBanner,
} from "./screens";
import { C, F } from "./theme";
import { Avatar, Keyboard, Modal, Phone, SCREEN_H, SFX, Sfx, StatusBar, TouchDot } from "./ui";
import { Words } from "./type";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const out = Easing.bezier(0.16, 1, 0.3, 1);
const easeIn = Easing.bezier(0.55, 0, 1, 0.45);
const overshoot = Easing.bezier(0.34, 1.35, 0.64, 1);

const useClock = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, fps, s: frame / fps };
};

/** 0 → 1 between `a` and `b` seconds. */
const k = (s: number, a: number, b: number, easing = ease) => interpolate(s, [a, b], [0, 1], { ...clamp, easing });

/** The phone dims while the title lands, then undims as it moves into the band. */
const dim = (s: number) => interpolate(s, [0, 0.12, 0.6, 1.0], [0, 0.6, 0.6, 0], clamp);

// ---------------------------------------------------------------- camera

type Key = [sec: number, scale: number, tx: number, ty: number];
/** Frame y (relative to centre) where the action sits: just above the caption band. */
const ACTION_Y = -110;
/** Camera that lands point (x, y), relative to the frame centre at scale 1, on the action spot. */
const aimAt = (sec: number, scale: number, x: number, y: number): Key => [sec, scale, -scale * x, ACTION_Y - scale * y];
/** Same, for screen point (sx, sy) on the centred phone. */
const aim = (sec: number, scale: number, sx: number, sy: number) => aimAt(sec, scale, sx - 195, sy - 422);
const home = (sec: number): Key => [sec, 1, 0, 0];

const Camera = ({ keys, shake = 0, children }: { keys: Key[]; shake?: number; children: ReactNode }) => {
  const { s } = useClock();
  const at = keys.map((key) => key[0]);
  const v = (i: number) => interpolate(s, at, keys.map((key) => key[i]), { ...clamp, easing: ease });
  return (
    <AbsoluteFill
      style={{
        scale: String(v(1)),
        translate: `${v(2) + shake * Math.sin(s * 90)}px ${v(3) + shake * Math.cos(s * 77)}px`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** Touch dot with times in seconds. */
const Touch = ({ path, taps, end }: { path: [number, number, number][]; taps: number[]; end: number }) => {
  const { frame, fps } = useClock();
  return (
    <TouchDot
      frame={frame}
      path={path.map(([t, x, y]) => [t * fps, x, y])}
      taps={taps.map((t) => t * fps)}
      show={[path[0][0] * fps - 6, end * fps]}
    />
  );
};

/** Characters typed from `start`, one every `per` seconds; key clicks included. */
const typing = (text: string, s: number, start: number, per: number) => {
  const n = Math.max(0, Math.min(text.length, Math.floor((s - start) / per) + 1));
  const pressed = n > 0 && n <= text.length && s - (start + (n - 1) * per) < per * 0.7 ? text[n - 1] : undefined;
  return { value: text.slice(0, n), pressed: s >= start ? pressed : undefined };
};
const KeyClicks = ({ text, start, per }: { text: string; start: number; per: number }) => {
  const { fps } = useClock();
  return (
    <>
      {[...text].map((_, i) => (
        <Sfx key={i} at={(start + i * per) * fps} src={SFX.tap} volume={0.12 + ((i * 7) % 5) * 0.03} />
      ))}
    </>
  );
};

const shakeAt = (s: number, at: number, len: number, amp: number) =>
  s >= at && s < at + len ? amp * Math.sin((s - at) * 70) * (1 - (s - at) / len) : 0;

// ---------------------------------------------------------------- 0:00 cold open

export const ColdOpen = () => {
  const { s } = useClock();
  return (
    <AbsoluteFill style={{ backgroundColor: "#000", opacity: 1 - k(s, 3.3, 4.0) }}>
      <Words
        words={[
          ["the", 0.4],
          ["ultimate", 0.9],
          ["networking", 1.4],
          ["tool", 2.0],
        ]}
        exit={3.0}
        size={128}
      />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 0:05 phone enters

export const PhoneEnter = () => {
  const { s } = useClock();
  return (
    <Camera keys={[[0, 0.94, 0, 0], [3, 1, 0, 0]]}>
      <Phone style={{ translate: `0 ${interpolate(s, [0, 0.9], [1100, 0], { ...clamp, easing: overshoot })}px` }}>
        <RadarScreen t={5 + s} pop={s - 0.8} />
      </Phone>
      <Sfx at={0} src={SFX.whoosh} volume={0.3} />
    </Camera>
  );
};

// ---------------------------------------------------------------- 1 radar

export const RadarBeat = () => {
  const { s, fps } = useClock();
  const t = 8 + s;
  const priya = radarPos(PRIYA, 8 + 7.0);
  const radar = <RadarScreen t={t} fit={k(s, 4.65, 5.0)} />;
  return (
    <Camera keys={[home(0.6), aim(1.1, 1.6, 195, 300), aim(10.4, 1.6, 195, 300), home(10.9)]}>
      <Phone dim={dim(s)}>
        {s < 7.2 ? (
          radar
        ) : (
          <Modal y={interpolate(s, [7.2, 7.65], [SCREEN_H, 0], { ...clamp, easing: out })} under={radar}>
            <PersonScreen person={PRIYA} scroll={interpolate(s, [8.6, 10.2], [0, 330], { ...clamp, easing: ease })} />
          </Modal>
        )}
        <Touch
          path={[
            [4.0, 130, 250],
            [4.6, 52, 119],
            [5.1, 70, 170],
            [6.4, 160, 300],
            [7.0, priya.x, priya.y],
          ]}
          taps={[4.6, 7.0]}
          end={7.3}
        />
      </Phone>
      <Sfx at={4.65 * fps} src={SFX.whoosh} volume={0.12} />
      <Sfx at={7.2 * fps} src={SFX.whoosh} volume={0.2} />
    </Camera>
  );
};

// ---------------------------------------------------------------- 2 AI match

export const MatchBeat = () => {
  const { s, fps } = useClock();
  return (
    <Camera keys={[home(0.6), aim(1.1, 1.6, 195, 330), aim(6.6, 1.6, 195, 330), aim(7.5, 2.1, 195, 306), aim(12.4, 2.1, 195, 306), home(12.9)]}>
      <Phone dim={dim(s)}>
        <MatchesScreen
          appear={s - 1.0}
          scroll={interpolate(s, [3.0, 4.0, 4.8], [0, 420, 230], { ...clamp, easing: ease })}
          leo={s < 5.2 ? "idle" : s < 6.6 ? "writing" : "done"}
          shimmer={(s - 5.2) / 0.8}
          words={(s - 6.6) / 0.12}
        />
        <Touch
          path={[
            [4.6, 260, 420],
            [5.2, 195, 270],
          ]}
          taps={[5.2]}
          end={5.5}
        />
      </Phone>
      {[0, 1, 2, 3].map((i) => (
        <Sfx key={i} at={(1.05 + i * 0.12) * fps} src={SFX.tap} volume={0.15} />
      ))}
      <KeyClicks text="................." start={6.6} per={0.12} />
    </Camera>
  );
};

// ---------------------------------------------------------------- build your pass

const bump = (s: number, at: number) => interpolate(s - at, [0, 0.1, 0.35], [0, 1, 0], clamp);

export const ProfileBeat = () => {
  const { s } = useClock();
  const bio = typing(BIO, s, 5.5, 0.06);
  const x = typing("samokafor", s, 12.1, 0.08);
  const kb = Math.max(k(s, 5.05, 5.35, out) * (1 - k(s, 7.6, 7.85)), k(s, 11.85, 12.15, out) * (1 - k(s, 13.3, 13.55)));
  const lfTaps: [number, string][] = [
    [8.8, "Investors"],
    [9.2, "Devs"],
    [9.6, "Designers"],
  ];
  const ofTaps: [number, string][] = [
    [10.2, "Users"],
    [10.6, "Partnerships"],
  ];
  return (
    <Camera keys={[home(0.6), aim(1.1, 1.6, 195, 200), aim(3.2, 1.6, 195, 200), aim(3.8, 1.6, 195, 330), aim(14.4, 1.6, 195, 330), home(14.9)]}>
      <Phone dim={dim(s)}>
        <Modal>
          <EditorScreen
            scroll={interpolate(s, [3.2, 3.8, 7.9, 8.5, 11.0, 11.5], [0, 520, 520, 900, 900, 1200], { ...clamp, easing: ease })}
            seed={s < 1.85 ? "radius-roll-1" : s < 2.55 ? "radius-roll-2" : SAM.id}
            pop={Math.max(bump(s, 1.85), bump(s, 2.55))}
            category={s < 4.3 ? "builder" : "founder"}
            bio={bio.value}
            bioFocused={s > 5.0 && s < 7.6}
            lf={lfTaps.filter(([at]) => s >= at).map(([, t]) => t)}
            of={ofTaps.filter(([at]) => s >= at).map(([, t]) => t)}
            x={x.value}
            xFocused={s > 11.8 && s < 13.3}
          />
        </Modal>
        <Keyboard show={kb} pressed={s < 9 ? bio.pressed : x.pressed} />
        <Touch
          path={[
            [1.3, 200, 330],
            [1.8, 286, 271],
            [2.2, 286, 271],
            [2.5, 286, 271],
          ]}
          taps={[1.8, 2.5]}
          end={2.8}
        />
        <Touch
          path={[
            [3.9, 250, 300],
            [4.3, 153, 172],
            [4.7, 220, 390],
            [5.0, 195, 431],
          ]}
          taps={[4.3, 5.0]}
          end={5.2}
        />
        <Touch
          path={[
            [8.4, 250, 330],
            [8.8, 77, 216],
            [9.2, 266, 216],
            [9.6, 80, 253],
            [10.2, 166, 448],
            [10.6, 167, 484],
          ]}
          taps={[8.8, 9.2, 9.6, 10.2, 10.6]}
          end={10.9}
        />
        <Touch
          path={[
            [11.5, 250, 330],
            [11.8, 230, 310],
          ]}
          taps={[11.8]}
          end={12.0}
        />
      </Phone>
      <KeyClicks text={BIO} start={5.5} per={0.06} />
      <KeyClicks text="samokafor" start={12.1} per={0.08} />
    </Camera>
  );
};

// ---------------------------------------------------------------- 3 AI summary

export const SummaryBeat = () => {
  const { s } = useClock();
  const site = typing("driftwood.xyz", s, 2.3, 0.13);
  const kb = s < 4.3 ? k(s, 1.85, 2.15, out) : 1 - k(s, 4.3, 4.55);
  return (
    <Camera
      keys={[
        home(0.6),
        aim(1.1, 1.6, 195, 500),
        aim(1.8, 1.6, 195, 500),
        aim(2.3, 1.6, 195, 430),
        aim(4.0, 2.0, 195, 420),
        aim(4.6, 1.6, 195, 560),
        aim(5.59, 1.6, 195, 560),
        aim(5.6, 1.6, 195, 429),
        aim(11.4, 1.6, 195, 429),
        home(11.9),
      ]}
    >
      <Phone dim={dim(s)}>
        {s < 5.6 ? (
          <>
            <Modal>
              <EditorScreen
                website={site.value}
                websiteFocused={s > 1.8 && s < 4.3}
                scroll={interpolate(s, [1.85, 2.15, 4.4, 5.0], [0, 140, 140, 972], { ...clamp, easing: ease })}
              />
            </Modal>
            <Keyboard show={kb} pressed={site.pressed} />
          </>
        ) : (
          <MeScreen reading={s < 6.8} summary={k(s, 6.8, 7.4, out)} />
        )}
        <Touch
          path={[
            [1.5, 260, 680],
            [1.8, 195, 558],
          ]}
          taps={[1.8]}
          end={2.0}
        />
        <Touch
          path={[
            [4.9, 270, 640],
            [5.3, 195, 771],
          ]}
          taps={[5.3]}
          end={5.5}
        />
      </Phone>
      <KeyClicks text="driftwood.xyz" start={2.3} per={0.13} />
    </Camera>
  );
};

// ---------------------------------------------------------------- 4 net worth

const TIERS: [string, string][] = [
  ["🦐", "Shrimp"],
  ["🦀", "Crab"],
  ["🐟", "Fish"],
  ["🐬", "Dolphin"],
  ["🦈", "Shark"],
  ["🐋", "Whale"],
];

const TierRow = ({ s }: { s: number }) => (
  <div style={{ display: "flex", gap: 48, alignItems: "flex-end" }}>
    {TIERS.map(([e, name], i) => {
      const whale = i === 5;
      const pop = interpolate(s - i * 0.08, [0, 0.12, 0.25], [0, whale ? 2.1 : 1.15, whale ? 1.8 : 1], clamp);
      return (
        <div key={name} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 130, lineHeight: 1, scale: String(pop), filter: whale ? `drop-shadow(0 0 40px ${C.blue}AA)` : undefined }}>
            {e}
          </span>
          <span style={{ fontFamily: whale ? F.bold : F.medium, fontSize: 30, color: whale ? C.text : C.muted, opacity: pop > 0 ? 1 : 0 }}>
            {name}
          </span>
        </div>
      );
    })}
  </div>
);

export const NetWorthBeat = () => {
  const { s, fps } = useClock();
  const cut = k(s, 9.4, 9.55) * (1 - k(s, 10.85, 11.0));
  return (
    <>
      <Camera keys={[home(0.6), aim(1.1, 1.7, 195, 450), aim(9.3, 1.7, 195, 450), home(10.0)]}>
        <Phone dim={dim(s)}>
          <MeScreen
            scroll={150}
            summary={1}
            wallet={s < 1.85 ? "none" : s < 3.6 ? "checking" : "verified"}
            verifiedAt={s - 3.6}
            amount={interpolate(s, [3.8, 5.6], [0, SAM.usd!], { ...clamp, easing: (x) => 1 - Math.pow(1 - x, 4) })}
            exact={1 - k(s, 7.35, 7.9)}
          />
          <Touch
            path={[
              [1.4, 270, 600],
              [1.8, 195, 458],
            ]}
            taps={[1.8]}
            end={2.0}
          />
          <Touch
            path={[
              [6.9, 260, 680],
              [7.3, 338, 579],
            ]}
            taps={[7.3]}
            end={7.6}
          />
        </Phone>
      </Camera>
      {cut > 0 && (
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${0.94 * cut})`, alignItems: "center", paddingTop: 260 }}>
          <div style={{ opacity: cut }}>
            <TierRow s={s - 9.5} />
          </div>
        </AbsoluteFill>
      )}
      <Sfx at={3.6 * fps} src={SFX.toggle} volume={0.3} />
      <Sfx at={7.32 * fps} src={SFX.toggle} volume={0.4} />
    </>
  );
};

// ---------------------------------------------------------------- 5 the room

export const RoomBeat = () => {
  const { s } = useClock();
  return (
    <Camera keys={[home(0.6), aim(1.1, 1.6, 195, 250), aim(11.4, 1.6, 195, 250), home(11.9)]}>
      <Phone dim={dim(s)}>
        <RoomScreen
          t={s - 0.7}
          w={s - 4.6}
          scroll={interpolate(s, [3.8, 4.6, 7.6, 9.0], [0, 300, 300, 700], { ...clamp, easing: ease })}
        />
      </Phone>
    </Camera>
  );
};

// ---------------------------------------------------------------- 6 wave (split)

/** Two phones: Sam's on the left, Priya's on the right, each with its own place. */
const Duo = ({
  left,
  right,
  l,
  r,
  dimmed = 0,
}: {
  left: ReactNode;
  right: ReactNode;
  l: [x: number, y: number, scale: number];
  r: [x: number, y: number, scale: number];
  dimmed?: number;
}) => (
  <>
    <Phone dim={dimmed} style={{ translate: `${l[0]}px ${l[1]}px`, scale: String(l[2]) }}>
      {left}
    </Phone>
    <Phone dim={dimmed} style={{ translate: `${r[0]}px ${r[1]}px`, scale: String(r[2]) }}>
      {right}
    </Phone>
  </>
);

const P = 0.9; // phone scale in the split
const Y = -68; // split phones ride up above the band
const SPLIT = 250;
const TOUCHING = 190;

export const WaveBeat = () => {
  const { s, fps } = useClock();
  const into = k(s, 0.5, 1.1);
  const scale = 1 + (P - 1) * into;
  const banner = k(s, 3.15, 3.5, out) * (1 - k(s, 5.6, 5.85));
  return (
    <Camera keys={[home(0), home(6.5), [10, 1.03, 0, -8]]}>
      <Duo
        dimmed={dim(s)}
        l={[-SPLIT * into + shakeAt(s, 5.75, 0.3, 5), Y * into, scale]}
        r={[interpolate(s, [0.6, 1.25], [1300, SPLIT], { ...clamp, easing: overshoot }) + shakeAt(s, 3.1, 0.4, 9), Y, P]}
        left={
          <>
            <Modal>
              <PersonScreen person={PRIYA} waved={s > 2.85} />
            </Modal>
            <WaveBanner from={PRIYA} show={k(s, 5.7, 6.05, out)} />
            <Touch
              path={[
                [2.3, 150, 430],
                [2.8, 76, 313],
              ]}
              taps={[2.8]}
              end={3.1}
            />
          </>
        }
        right={
          <>
            <Modal>
              <PersonScreen person={SAM} />
            </Modal>
            <WaveBanner from={SAM} show={banner} />
            <Touch
              path={[
                [4.9, 250, 260],
                [5.4, 318, 84],
              ]}
              taps={[5.4]}
              end={5.7}
            />
          </>
        }
      />
      <Sfx at={2.85 * fps} src={SFX.whoosh} volume={0.5} />
      <Sfx at={5.45 * fps} src={SFX.whoosh} volume={0.4} />
      <Sfx at={3.15 * fps} src={SFX.chime} volume={0.35} />
      <Sfx at={5.7 * fps} src={SFX.chime} volume={0.3} />
    </Camera>
  );
};

// ---------------------------------------------------------------- 7 finder (split)

const STEPS: [at: number, heat: number, label: string, rssi: number][] = [
  [1.1, 0.1, "Cold, keep moving", -86],
  [3.4, 0.32, "Getting warmer", -74],
  [5.7, 0.52, "Warmer", -64],
  [8.0, 0.92, "Right here", -44],
];

export const FinderBeat = () => {
  const { s, fps } = useClock();
  const gap = (t: number) => interpolate(t, [0, 11], [SPLIT, TOUCHING], clamp);
  const step = [...STEPS].reverse().find(([at]) => s >= at) ?? STEPS[0];
  const heat = interpolate(s, [3.4, 3.7, 5.7, 6.0, 8.0, 8.25], [0.1, 0.32, 0.32, 0.52, 0.52, 0.92], clamp);
  const period = 1.4 - step[1] * 1.25;
  const beat = (((s - step[0]) / period) % 1 + 1) % 1;
  // punch in on Sam's Finder at each step, out between them to show the gap closing
  const focus = (t: number, scale: number) => aimAt(t, scale, -gap(t), Y + P * (560 - 422));
  const keys: Key[] = [home(0.6)];
  STEPS.forEach(([at], i) => {
    keys.push(focus(at + 0.3, 1.35));
    if (i < STEPS.length - 1) keys.push(focus(at + 1.6, 1.35), home(at + 2.0));
  });
  keys.push(focus(10.3, 1.35), home(10.8));
  const shake = Math.max(...STEPS.map(([at]) => Math.abs(shakeAt(s, at, 0.25, 6))));
  return (
    <Camera keys={keys} shake={shake}>
      <Duo
        dimmed={dim(s)}
        l={[-gap(s), Y, P]}
        r={[gap(s), Y, P]}
        left={
          <>
            <FinderScreen heat={heat} beat={beat} label={step[2]} rssi={step[3]} trend={s > 3.5 && s < 8.0} />
            <StatusBar />
          </>
        }
        right={
          <Modal>
            <PersonScreen person={SAM} />
          </Modal>
        }
      />
      {STEPS.map(([at]) => (
        <Sfx key={at} at={at * fps} src={SFX.tap} volume={0.35} />
      ))}
    </Camera>
  );
};

// ---------------------------------------------------------------- 8 proof of meet (split)

const UID = "0x8f3c1d27e9a4b6058c2f7e1d93ab4c60f2e85d17b9c3a046e1f2d8b7c5a39e04";

const Arc = ({ p }: { p: number }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible" }}>
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="8" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d={`M ${960 + TOUCHING} 470 Q 960 40 ${960 - TOUCHING} 470`}
      pathLength={1}
      fill="none"
      stroke="#FFFFFF"
      strokeWidth={6}
      strokeLinecap="round"
      strokeDasharray="0.35 1"
      strokeDashoffset={interpolate(p, [0, 1], [0.35, -1])}
      filter="url(#glow)"
      opacity={interpolate(p, [0, 0.1, 0.85, 1], [0, 1, 1, 0])}
    />
  </svg>
);

const StampHero = ({ s }: { s: number }) => {
  const pop = interpolate(s, [0, 0.15, 0.3], [0.6, 1.08, 1], { ...clamp, easing: out });
  const uid = Math.floor(interpolate(s, [0.3, 1.3], [0, UID.length], clamp));
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
      <div style={{ position: "relative", display: "flex", scale: String(pop) }}>
        <Avatar person={SAM} size={170} style={{ border: "6px solid #000" }} />
        <Avatar person={PRIYA} size={170} style={{ border: "6px solid #000", marginLeft: -40 }} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: -14,
            marginLeft: -36,
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: C.surface,
            border: `2px solid ${C.lineStrong}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Handshake size={38} color={C.green} strokeWidth={2} />
        </div>
      </div>
      <span style={{ fontFamily: F.bold, fontSize: 72, letterSpacing: -2, color: C.text, scale: String(pop) }}>Stamp minted on Base</span>
      <span style={{ fontFamily: "'SF Mono', Menlo, monospace", fontSize: 22, color: C.muted, letterSpacing: 0.5 }}>
        EAS UID {UID.slice(0, uid)}
        <span style={{ opacity: 0 }}>{UID.slice(uid)}</span>
      </span>
    </div>
  );
};

export const MeetBeat = () => {
  const { s, fps } = useClock();
  const met = s < 4.8 ? undefined : s < 6.6 ? "minting" : "minted";
  const leave = k(s, 10.0, 11.0);
  const hero = k(s, 7.6, 7.75) * (1 - k(s, 9.65, 9.8));
  return (
    <>
      <Camera keys={[home(0.6), [1.0, 1.06, 0, 10], [9.8, 1.06, 0, 10], home(10.6)]}>
        <Duo
          dimmed={dim(s)}
          l={[-TOUCHING * (1 - leave), Y * (1 - leave), P + (1 - P) * leave]}
          r={[TOUCHING + interpolate(s, [10.0, 10.7], [0, 1300], { ...clamp, easing: easeIn }), Y, P]}
          left={
            <>
              <Modal>
                <PersonScreen person={PRIYA} waved met={met} />
              </Modal>
              <Touch
                path={[
                  [1.4, 250, 430],
                  [1.8, 314, 313],
                ]}
                taps={[1.8]}
                end={2.1}
              />
            </>
          }
          right={
            <>
              <Modal>
                <PersonScreen person={SAM} met={met} />
              </Modal>
              {s > 2.0 && s < 4.4 && <MeetPrompt from={SAM} show={k(s, 2.0, 2.4, overshoot) * (1 - k(s, 4.1, 4.35))} />}
              <Touch
                path={[
                  [3.5, 270, 600],
                  [4.0, 195, 713],
                ]}
                taps={[4.0]}
                end={4.3}
              />
            </>
          }
        />
        {s > 4.1 && s < 4.9 && <Arc p={k(s, 4.15, 4.8)} />}
      </Camera>
      {hero > 0 && (
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${0.94 * hero})`, alignItems: "center", paddingTop: 170 }}>
          <div style={{ opacity: hero }}>
            <StampHero s={s - 7.65} />
          </div>
        </AbsoluteFill>
      )}
      <Sfx at={4.15 * fps} src={SFX.whoosh} volume={0.5} />
      <Sfx at={10.0 * fps} src={SFX.whoosh} volume={0.2} />
    </>
  );
};

// ---------------------------------------------------------------- 9 notes and export

export const NOTE = "pre-seed, follow up after demo day";

export const NotesBeat = () => {
  const { s, fps } = useClock();
  const note = typing(NOTE, s, 2.1, 0.07);
  return (
    <Camera
      keys={[
        home(0.6),
        aim(1.1, 1.7, 195, 440),
        aim(5.49, 1.7, 195, 440),
        aim(5.5, 1.7, 195, 380),
        aim(8.1, 1.7, 195, 380),
        aim(8.8, 1.5, 195, 450),
        aim(12.4, 1.5, 195, 450),
        home(12.9),
      ]}
    >
      <Phone dim={dim(s)}>
        {s < 5.5 ? (
          <>
            <Modal>
              <PersonScreen person={PRIYA} waved met="minted" note={note.value} noteFocused={s > 1.6 && s < 4.9} />
            </Modal>
            <Keyboard show={k(s, 1.65, 1.95, out) * (1 - k(s, 4.9, 5.15))} pressed={note.pressed} />
          </>
        ) : (
          <>
            <MeScreen scroll={500} summary={1} wallet="verified" exact={0} amount={SAM.usd} met />
            <ShareSheet show={k(s, 8.35, 8.8, out)} />
          </>
        )}
        <Touch
          path={[
            [1.3, 260, 600],
            [1.6, 195, 455],
          ]}
          taps={[1.6]}
          end={1.8}
        />
        <Touch
          path={[
            [7.6, 260, 460],
            [8.2, 345, 284],
          ]}
          taps={[8.2]}
          end={8.5}
        />
      </Phone>
      <KeyClicks text={NOTE} start={2.1} per={0.07} />
      <Sfx at={8.35 * fps} src={SFX.whoosh} volume={0.35} />
    </Camera>
  );
};

// ---------------------------------------------------------------- exit and close

export const Exit = () => {
  const { s } = useClock();
  return (
    <>
      <Phone style={{ translate: `0 ${interpolate(s, [0.2, 0.8], [0, 1150], { ...clamp, easing: easeIn })}px` }}>
        <MeScreen scroll={500} summary={1} wallet="verified" exact={0} amount={SAM.usd} met />
      </Phone>
      <Sfx at={12} src={SFX.whoosh} volume={0.2} />
    </>
  );
};

const PLACES = ["events", "conferences", "parties", "meetups", "hacker houses"];
const PLACE_AT = (i: number) => 0.7 + i * 0.5; // each place holds 0.5 s in the slot
const COLLAPSE = 3.3; // the cycling slot turns into the full list

/** Text that snaps up from 12 px with a blur, at `at` seconds. */
const Rise = ({ s, at, children, style }: { s: number; at: number; children: ReactNode; style?: React.CSSProperties }) => {
  const r = k(s, at, at + 0.2, out);
  return (
    <span style={{ opacity: r, translate: `0 ${(1 - r) * 12}px`, filter: `blur(${(1 - r) * 10}px)`, whiteSpace: "nowrap", ...style }}>
      {children}
    </span>
  );
};

const big = { fontFamily: F.bold, fontSize: 120, letterSpacing: -4, color: C.text, lineHeight: 1 };

/**
 * "built for" over a slot that cycles through the places, which then collapses
 * into the full list, and "on Offline Protocol" lands underneath.
 */
export const Close = () => {
  const { s } = useClock();
  return (
    <>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 34 }}>
        <Rise s={s} at={0.2} style={big}>
          built for
        </Rise>
        <div style={{ position: "relative", width: 1600, height: 130 }}>
          {PLACES.map((p, i) => {
            const enter = k(s, PLACE_AT(i), PLACE_AT(i) + 0.2, out);
            const leave = i < PLACES.length - 1 ? k(s, PLACE_AT(i + 1), PLACE_AT(i + 1) + 0.15) : k(s, COLLAPSE, COLLAPSE + 0.2);
            return (
              <span
                key={p}
                style={{
                  ...big,
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.muted,
                  opacity: enter * (1 - leave),
                  translate: `0 ${(1 - enter) * 40 - leave * 40}px`,
                  filter: `blur(${(1 - enter) * 10 + leave * 10}px)`,
                }}
              >
                {p}
              </span>
            );
          })}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 18 }}>
            {PLACES.map((p, i) => (
              <Rise key={p} s={s} at={COLLAPSE + 0.15 + i * 0.07} style={{ fontFamily: F.medium, fontSize: 50, color: C.muted }}>
                {i ? <span style={{ color: C.faint, marginRight: 18 }}>·</span> : null}
                {p}
              </Rise>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 34 }}>
          <Rise s={s} at={4.1} style={big}>
            on
          </Rise>
          <Rise s={s} at={4.45} style={big}>
            Offline Protocol
          </Rise>
        </div>
      </AbsoluteFill>
      {s >= 6.7 && <AbsoluteFill style={{ backgroundColor: "#000" }} />}
    </>
  );
};
