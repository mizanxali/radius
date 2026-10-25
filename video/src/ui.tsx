import { Avatar as DiceAvatar, Style } from "@dicebear/core";
import avataaars from "@dicebear/styles/avataaars.json";
import {
  Asterisk,
  ChevronLeft,
  CircleUserRound,
  Coins,
  Dices,
  Hammer,
  Handshake,
  Microscope,
  Palette,
  Radar,
  Rocket,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Img, interpolate, Sequence } from "remotion";
import { Audio } from "@remotion/media";
import type { Person } from "./data";
import { C, CAT_COLOR, CAT_GRADIENT, F, R, T, type Category } from "./theme";

export const SCREEN_W = 390;
export const SCREEN_H = 844;
const BEZEL = 12;
export const PHONE_W = SCREEN_W + BEZEL * 2;
export const PHONE_H = SCREEN_H + BEZEL * 2;

export const SFX = {
  tap: "https://remotion.media/mouse-click.wav",
  whoosh: "https://remotion.media/whoosh.wav",
  chime: "https://remotion.media/ding.wav",
  toggle: "https://remotion.media/switch.wav",
};

/** One sound effect starting at `at` (frames, relative to the parent sequence). */
export const Sfx = ({ at, src, volume = 0.6 }: { at: number; src: string; volume?: number }) => (
  <Sequence from={Math.round(at)} durationInFrames={90} layout="none">
    <Audio src={src} volume={volume} />
  </Sequence>
);

export const CAT_LABEL: Record<Category, [string, string]> = {
  builder: ["Builder", "🛠️"],
  founder: ["Founder", "🚀"],
  investor: ["Investor", "💰"],
  designer: ["Designer", "🎨"],
  researcher: ["Researcher", "🔬"],
  bd: ["BD / Growth", "🤝"],
  degen: ["Degen", "🎰"],
};

export const CAT_ICON: Record<Category, LucideIcon> = {
  builder: Hammer,
  founder: Rocket,
  investor: Coins,
  designer: Palette,
  researcher: Microscope,
  bd: Handshake,
  degen: Dices,
};

// ---------------------------------------------------------------- avatars

const dicebear = new Style(avataaars as never);
const svgs = new Map<string, string>();
const avatarUri = (seed: string) => {
  if (!svgs.has(seed)) {
    const xml = new DiceAvatar(dicebear, { seed }).toString();
    svgs.set(seed, `data:image/svg+xml;utf8,${encodeURIComponent(xml)}`);
  }
  return svgs.get(seed)!;
};

export const Avatar = ({
  person,
  size,
  seed = person.id,
  style,
}: {
  person: Person;
  size: number;
  /** DiceBear seed; defaults to the address, as in the app. */
  seed?: string;
  style?: CSSProperties;
}) => {
  const [a, b] = CAT_GRADIENT[person.category];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${a}, ${b})`,
        ...style,
      }}
    >
      <Img src={avatarUri(seed)} style={{ width: size, height: size, display: "block" }} />
    </div>
  );
};

// ---------------------------------------------------------------- kit

export const Card = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    style={{
      backgroundColor: C.surface,
      borderRadius: R.card,
      border: `1px solid ${C.line}`,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Row = ({ children, gap = 8, style }: { children: ReactNode; gap?: number; style?: CSSProperties }) => (
  <div style={{ display: "flex", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap, ...style }}>
    {children}
  </div>
);

export const Chip = ({
  label,
  icon: I,
  selected,
  color = C.blue,
  style,
}: {
  label: string;
  icon?: LucideIcon;
  selected?: boolean;
  color?: string;
  style?: CSSProperties;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      border: `1px solid ${selected ? "#FFFFFF66" : C.lineStrong}`,
      backgroundColor: selected ? C.raised : "transparent",
      borderRadius: R.chip,
      padding: "4px 8px",
      flexShrink: 0,
      ...style,
    }}
  >
    {I && <I size={12} strokeWidth={2.2} color={selected ? color : C.faint} />}
    <span style={{ fontFamily: F.medium, fontSize: 12, color: selected ? C.text : C.muted }}>{label}</span>
  </div>
);

export const Tag = ({
  label,
  icon: I,
  color = C.muted,
  solid,
}: {
  label: string;
  icon?: LucideIcon;
  color?: string;
  solid?: boolean;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      borderRadius: R.tag,
      border: `1px solid ${C.lineStrong}`,
      backgroundColor: solid ? C.text : C.raised,
      padding: "2px 6px",
      flexShrink: 0,
    }}
  >
    {I && <I size={11} strokeWidth={2.4} color={color} />}
    <span style={{ fontFamily: F.medium, fontSize: 10.5, color: solid ? C.ink : C.text, whiteSpace: "nowrap" }}>
      {label}
    </span>
  </div>
);

export const CategoryTag = ({ category }: { category: Category }) => (
  <Tag label={CAT_LABEL[category][0]} icon={CAT_ICON[category]} color={CAT_COLOR[category]} />
);

export const ListRow = ({
  leading,
  title,
  subtitle,
  trailing,
  style,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  style?: CSSProperties;
}) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 0", ...style }}>
    {leading}
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ ...T.strong, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</span>
      {subtitle && (
        <span style={{ ...T.sub, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{subtitle}</span>
      )}
    </div>
    {trailing}
  </div>
);

const IconButton = ({ icon: I }: { icon: LucideIcon }) => (
  <div
    style={{
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: C.surface,
      border: `1px solid ${C.lineStrong}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <I size={16} color={C.text} strokeWidth={2} />
  </div>
);

export const Header = ({ title, back, right }: { title: string; back?: boolean; right?: ReactNode }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 34 }}>
    {back && <IconButton icon={ChevronLeft} />}
    <span style={{ ...T.header, flex: 1 }}>{title}</span>
    {right}
  </div>
);

export const Button = ({
  title,
  icon: I,
  variant = "primary",
  style,
  disabled,
}: {
  title: string;
  icon?: LucideIcon;
  variant?: "primary" | "outline";
  style?: CSSProperties;
  disabled?: boolean;
}) => {
  const primary = variant === "primary";
  const fg = primary ? C.ink : C.text;
  return (
    <div
      style={{
        height: 38,
        borderRadius: R.input,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 16px",
        backgroundColor: primary ? C.text : "transparent",
        border: primary ? "none" : `1px solid ${C.lineStrong}`,
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
        ...style,
      }}
    >
      {I && <I size={16} color={fg} strokeWidth={2} />}
      <span style={{ fontFamily: F.bold, fontSize: 14, color: fg, whiteSpace: "nowrap" }}>{title}</span>
    </div>
  );
};

export const Action = ({
  icon: I,
  label,
  color = C.text,
  disabled,
}: {
  icon: LucideIcon;
  label: string;
  color?: string;
  disabled?: boolean;
}) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flex: 1, opacity: disabled ? 0.4 : 1 }}>
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: C.surface,
        border: `1px solid ${C.lineStrong}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <I size={19} color={color} strokeWidth={1.75} />
    </div>
    <span style={{ fontFamily: F.medium, fontSize: 11.5, color: C.muted }}>{label}</span>
  </div>
);

/** Labelled input, as in the app's ProfileEditor `Field`. */
export const Field = ({
  label,
  value,
  placeholder,
  focused,
  multiline,
}: {
  label: string;
  value: string;
  placeholder?: string;
  focused?: boolean;
  multiline?: boolean;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <span style={T.label}>{label}</span>
    <div
      style={{
        backgroundColor: C.bg,
        borderRadius: R.input,
        border: `1px solid ${focused ? C.muted : C.lineStrong}`,
        padding: multiline ? "8px 10px" : "0 10px",
        height: multiline ? 80 : 38,
        display: "flex",
        alignItems: multiline ? "flex-start" : "center",
        fontFamily: F.regular,
        fontSize: 14,
        lineHeight: "20px",
        color: value ? C.text : C.faint,
      }}
    >
      <span>
        {value || placeholder}
        {focused && (
          <span style={{ display: "inline-block", width: 2, height: 17, marginLeft: 1, background: C.blue, verticalAlign: "-3px" }} />
        )}
      </span>
    </div>
  </div>
);

// ---------------------------------------------------------------- pass card

export const PassCard = ({
  person,
  status,
  seed,
  pop = 0,
  children,
}: {
  person: Person;
  status?: string;
  seed?: string;
  /** 0 … 1 bump on the avatar, for a freshly rolled one. */
  pop?: number;
  children?: ReactNode;
}) => {
  const color = CAT_COLOR[person.category];
  return (
    <div
      style={{
        position: "relative",
        borderRadius: R.card + 4,
        border: `1px solid ${C.lineStrong}`,
        backgroundColor: C.surface,
        overflow: "hidden",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(225deg, ${color}55 0%, ${color}00 65%)`,
        }}
      />
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Asterisk size={16} color={C.text} strokeWidth={2} />
          <span style={{ fontFamily: F.xbold, fontSize: 11, color: C.text, letterSpacing: 2 }}>RADIUS</span>
        </div>
        <CategoryTag category={person.category} />
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar person={person} size={46} seed={seed} style={{ scale: String(1 + pop * 0.18) }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontFamily: F.bold, fontSize: 19, color: C.text, letterSpacing: -0.6 }}>{person.name}</span>
          <span style={{ fontFamily: F.regular, fontSize: 11, color: C.muted }}>
            {person.role} · {person.company}
          </span>
        </div>
      </div>
      {children && <div style={{ position: "relative" }}>{children}</div>}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: F.medium, fontSize: 11, color: C.faint, letterSpacing: 0.5 }}>
          {person.id.slice(0, 6)}…{person.id.slice(-4)}
        </span>
        {status && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
            <span style={{ fontFamily: F.medium, fontSize: 11, color: C.muted }}>{status}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- phone chrome

export const StatusBar = () => (
  <div
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 54,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "6px 34px 0 46px",
      fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      fontSize: 16,
      fontWeight: 600,
      color: C.text,
    }}
  >
    <span>9:41</span>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width="18" height="12" viewBox="0 0 18 12">
        {[0, 1, 2, 3].map((i) => (
          <rect key={i} x={i * 5} y={9 - i * 3} width="3" height={3 + i * 3} rx="1" fill={C.text} />
        ))}
      </svg>
      <svg width="16" height="12" viewBox="0 0 16 12">
        <path d="M8 11.5 L5.6 9 A3.4 3.4 0 0 1 10.4 9 Z" fill={C.text} />
        <path d="M3.3 6.7 A6.6 6.6 0 0 1 12.7 6.7" stroke={C.text} strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M1 4.3 A9.9 9.9 0 0 1 15 4.3" stroke={C.text} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ width: 25, height: 12, borderRadius: 4, border: "1px solid #FFFFFF88", padding: 1.5 }}>
        <div style={{ width: "80%", height: "100%", borderRadius: 2, backgroundColor: C.text }} />
      </div>
    </div>
  </div>
);

const TABS: [LucideIcon, string][] = [
  [Radar, C.blue],
  [Sparkles, C.purple],
  [Trophy, C.amber],
  [CircleUserRound, C.green],
];

export const TabBar = ({ active }: { active?: number }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 90,
      backgroundColor: C.bg,
      borderTop: `1px solid ${C.line}`,
      display: "flex",
      justifyContent: "space-around",
      paddingTop: 12,
    }}
  >
    {TABS.map(([I, accent], i) => (
      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
        <I size={20} color={i === active ? accent : C.faint} strokeWidth={1.9} />
        <div style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: i === active ? accent : "transparent" }} />
      </div>
    ))}
  </div>
);

/** A scrolling app page: content under the status bar, optional tab bar. */
export const Screen = ({
  children,
  scroll = 0,
  tab,
  gap = 10,
  top = 63,
  sheet,
}: {
  children: ReactNode;
  scroll?: number;
  tab?: number;
  gap?: number;
  top?: number;
  /** Inside a Modal: no status bar or top scrim. */
  sheet?: boolean;
}) => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: C.bg, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        padding: `${top}px 16px 110px`,
        display: "flex",
        flexDirection: "column",
        gap,
        translate: `0 ${-scroll}px`,
      }}
    >
      {children}
    </div>
    {!sheet && (
      <>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 83,
            background: `linear-gradient(${C.bg} 0%, ${C.bg} 60%, ${C.bg}00 100%)`,
          }}
        />
        <StatusBar />
      </>
    )}
    {tab !== undefined && <TabBar active={tab} />}
  </div>
);

export const SHEET_TOP = 50;

/** iOS page sheet over `under` (or black), raised by `y` (0 = fully up). */
export const Modal = ({ children, y = 0, under }: { children: ReactNode; y?: number; under?: ReactNode }) => (
  <>
    {under ?? <div style={{ position: "absolute", inset: 0, backgroundColor: "#000" }} />}
    <div style={{ position: "absolute", inset: 0, backgroundColor: "#000", opacity: under ? 0.6 * (1 - y / SCREEN_H) : 0 }} />
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: SHEET_TOP,
        bottom: 0,
        translate: `0 ${y}px`,
        borderRadius: "12px 12px 0 0",
        overflow: "hidden",
        backgroundColor: C.bg,
        borderTop: `1px solid ${C.line}`,
      }}
    >
      {children}
    </div>
    <StatusBar />
  </>
);

/** iOS keyboard, sliding up by `show` (0 … 1). */
export const Keyboard = ({ show, pressed }: { show: number; pressed?: string }) => {
  const rows = ["qwertyuiop", "asdfghjkl", "zxcvbnm"];
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 291,
        backgroundColor: "#2B2B2D",
        translate: `0 ${(1 - show) * 291}px`,
        padding: "8px 3px 0",
        display: "flex",
        flexDirection: "column",
        gap: 11,
      }}
    >
      {rows.map((r, i) => (
        <div key={r} style={{ display: "flex", justifyContent: "center", gap: 6, padding: i === 1 ? "0 18px" : 0 }}>
          {i === 2 && <Key w={44} dark />}
          {[...r].map((k) => (
            <Key key={k} label={k} lit={pressed === k} />
          ))}
          {i === 2 && <Key w={44} dark />}
        </div>
      ))}
      <div style={{ display: "flex", gap: 6, padding: "0 0" }}>
        <Key w={92} dark label="123" />
        <Key w={190} label={pressed === " " ? "" : "space"} lit={pressed === " "} />
        <Key w={92} dark label="return" />
      </div>
    </div>
  );
};

const Key = ({ label, w = 33, dark, lit }: { label?: string; w?: number; dark?: boolean; lit?: boolean }) => (
  <div
    style={{
      width: w,
      height: 42,
      borderRadius: 5,
      backgroundColor: lit ? "#8E8E93" : dark ? "#46464A" : "#6B6B6E",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      fontSize: label && label.length > 1 ? 15 : 22,
      color: C.text,
      scale: lit ? "1.15" : "1",
    }}
  >
    {label}
  </div>
);

/** The device: bezel, rounded screen, dynamic island. `dim` darkens the screen (0 … 1). */
export const Phone = ({ children, dim = 0, style }: { children: ReactNode; dim?: number; style?: CSSProperties }) => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "50%",
      width: PHONE_W,
      height: PHONE_H,
      marginLeft: -PHONE_W / 2,
      marginTop: -PHONE_H / 2,
      borderRadius: 64,
      backgroundColor: "#0B0B0C",
      border: "2px solid #3A3A3C",
      boxShadow: "0 40px 120px #000000CC, inset 0 0 0 1px #000",
      padding: BEZEL - 2,
      ...style,
    }}
  >
    <div style={{ position: "relative", width: SCREEN_W, height: SCREEN_H, borderRadius: 52, overflow: "hidden", backgroundColor: C.bg }}>
      {children}
      <div
        style={{
          position: "absolute",
          top: 11,
          left: SCREEN_W / 2 - 62,
          width: 124,
          height: 36,
          borderRadius: 18,
          backgroundColor: "#000",
        }}
      />
      <div style={{ position: "absolute", inset: 0, backgroundColor: "#000", opacity: dim, pointerEvents: "none" }} />
    </div>
  </div>
);

// ---------------------------------------------------------------- touch dot

/**
 * A soft touch dot in screen points. `path` is [frame, x, y] keyframes (eased between),
 * `taps` are the frames where it presses (with a tap sound).
 */
export const TouchDot = ({
  frame,
  path,
  taps,
  show,
}: {
  frame: number;
  path: [number, number, number][];
  taps: number[];
  show: [number, number];
}) => {
  const fs = path.map((p) => p[0]);
  const ease = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeInOut } as const;
  const x = path.length > 1 ? interpolate(frame, fs, path.map((p) => p[1]), ease) : path[0][1];
  const y = path.length > 1 ? interpolate(frame, fs, path.map((p) => p[2]), ease) : path[0][2];
  const press = Math.max(0, ...taps.map((t) => interpolate(frame, [t - 4, t, t + 8], [0, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const ripple = taps.find((t) => frame >= t && frame < t + 24);
  const opacity = interpolate(frame, [show[0], show[0] + 8, show[1] - 8, show[1]], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <>
      {taps.map((t) => (
        <Sfx key={t} at={t} src={SFX.tap} volume={0.5} />
      ))}
      <div style={{ position: "absolute", left: x, top: y, opacity, pointerEvents: "none" }}>
        {ripple !== undefined && (
          <div
            style={{
              position: "absolute",
              width: 44,
              height: 44,
              left: -22,
              top: -22,
              borderRadius: 22,
              border: "2px solid #FFFFFF",
              opacity: interpolate(frame - ripple, [0, 24], [0.7, 0]),
              scale: String(interpolate(frame - ripple, [0, 24], [0.6, 1.8])),
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            width: 34,
            height: 34,
            left: -17,
            top: -17,
            borderRadius: 17,
            backgroundColor: "#FFFFFFB0",
            border: "1.5px solid #FFFFFF",
            boxShadow: "0 4px 18px #00000088",
            scale: String(1 - press * 0.22),
          }}
        />
      </div>
    </>
  );
};

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
