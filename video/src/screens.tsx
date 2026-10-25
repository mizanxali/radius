import {
  BadgeCheck,
  Banknote,
  Bluetooth,
  Briefcase,
  Camera,
  Dices,
  Check,
  Code,
  Flame,
  Gift,
  Globe,
  Hand,
  Handshake,
  LocateFixed,
  Megaphone,
  MessageCircle,
  PartyPopper,
  PenLine,
  PenTool,
  Radio,
  RefreshCw,
  Share2,
  Sparkles,
  StickyNote,
  Target,
  Trash2,
  UserPlus,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { interpolate } from "remotion";
import { HANA, LEO, money, PRIYA, ROOM, SAM, usd, type Person } from "./data";
import {
  Action,
  Avatar,
  Button,
  CAT_ICON,
  CAT_LABEL,
  Card,
  Chip,
  Field,
  Header,
  ListRow,
  PassCard,
  Row,
  Screen,
  Tag,
} from "./ui";
import { C, CAT_COLOR, F, R, T, type Category } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const outBack = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

const TAG_ICON: Record<string, LucideIcon> = {
  Investors: Banknote,
  "Co-founder": UserPlus,
  Devs: Code,
  Designers: PenTool,
  Users,
  Hiring: Megaphone,
  "A job": Briefcase,
  Grants: Gift,
  Partnerships: Handshake,
  Alpha: Sparkles,
  Frens: PartyPopper,
};

const Label = ({ children, color = C.muted }: { children: string; color?: string }) => (
  <span style={{ ...T.label, color }}>{children}</span>
);

const Inline = ({ children, gap = 6 }: { children: React.ReactNode; gap?: number }) => (
  <div style={{ display: "flex", alignItems: "center", gap }}>{children}</div>
);

// ---------------------------------------------------------------- radar

const RADAR = 330; // width - 60, as in the app
export const RADAR_TOP = 185; // y of the radar square on screen
const DOT = 30;

/** Where an attendee sits on the radar at time `t` (s), in screen points. */
export const radarPos = (p: Person, t: number) => {
  const i = ROOM.indexOf(p);
  const a = p.angle * 2 * Math.PI - Math.PI / 2 + 0.03 * Math.sin(t * 0.5 + i);
  const minR = (56 / 2 + DOT / 2 + 6) / (RADAR / 2);
  // signal wobble: avatars move closer and further
  const r = Math.min(0.94, minR + (0.9 - minR) * p.r + 0.07 * Math.sin(t * 0.9 + i * 1.7));
  return {
    x: 16 + 1 + 12 + RADAR / 2 + Math.cos(a) * r * (RADAR / 2),
    y: RADAR_TOP + RADAR / 2 + Math.sin(a) * r * (RADAR / 2),
  };
};

const distance = (p: Person) =>
  p.r < 0.3 ? "right next to you" : p.r < 0.55 ? "a few steps away" : p.r < 0.8 ? "nearby" : "across the room";

/**
 * Radar tab. `t` is the clock (s) for the sweep and drift, `pop` the seconds since
 * avatars started popping in (undefined: all there), `fit` how far the Good fit filter is on.
 */
export const RadarScreen = ({ t, pop, fit = 0 }: { t: number; pop?: number; fit?: number }) => {
  const shown = pop === undefined ? ROOM.length : Math.max(0, Math.min(ROOM.length, Math.floor(pop / 0.1) + 1));
  const fits = [PRIYA, LEO, HANA];
  return (
    <Screen tab={0}>
      <Header title="Around you" />
      <div style={{ display: "flex", gap: 8, marginRight: -16, overflow: "hidden" }}>
        <Chip label="Good fit" icon={Target} color={C.purple} selected={fit > 0.5} />
        {(["investor", "founder", "builder", "designer", "bd", "researcher"] as Category[]).map((c) => (
          <Chip key={c} label={CAT_LABEL[c][0]} color={CAT_COLOR[c]} />
        ))}
      </div>
      <Card>
        <div style={{ display: "flex", alignItems: "center", height: 20 }}>
          <span style={{ ...T.label, flex: 1 }}>Nearby</span>
          <Tag
            label={fit > 0.5 ? `3 of ${ROOM.length}` : shown ? `${Math.min(shown, ROOM.length)} people` : "Scanning"}
            icon={shown ? Users : Radio}
            color={shown ? C.green : C.faint}
          />
        </div>
        <div style={{ position: "relative", width: RADAR, height: RADAR, alignSelf: "center", margin: "4px 0" }}>
          {[1, 0.68, 0.36].map((f) => (
            <div
              key={f}
              style={{
                position: "absolute",
                width: RADAR * f,
                height: RADAR * f,
                left: (RADAR * (1 - f)) / 2,
                top: (RADAR * (1 - f)) / 2,
                borderRadius: 999,
                border: `1px solid ${C.line}`,
              }}
            />
          ))}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              backgroundColor: C.text,
              scale: String(0.2 + ((t / 2.8) % 1) * 0.8),
              opacity: 0.12 * (1 - ((t / 2.8) % 1)),
            }}
          />
          <div style={{ position: "absolute", inset: 0, rotate: `${(t / 4.5) * 360}deg` }}>
            <div
              style={{
                position: "absolute",
                left: RADAR / 2,
                top: RADAR / 2 - 1,
                width: RADAR / 2,
                height: 2,
                borderRadius: 1,
                background: "linear-gradient(90deg, #FFFFFF00, #FFFFFFB3)",
              }}
            />
          </div>
          <div
            style={{
              position: "absolute",
              left: RADAR / 2 - 28,
              top: RADAR / 2 - 28,
              padding: 4,
              borderRadius: 40,
              border: `1px solid ${C.lineStrong}`,
              backgroundColor: C.bg,
            }}
          >
            <Avatar person={SAM} size={46} />
          </div>
          {ROOM.slice(0, shown).map((p, i) => {
            const { x, y } = radarPos(p, t);
            const age = pop === undefined ? 9 : pop - i * 0.1;
            const lit = fits.includes(p);
            const halo = (Math.sin(t * 2 + i) + 1) / 2;
            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: x - 29 - DOT / 2,
                  top: y - RADAR_TOP - DOT / 2,
                  width: DOT,
                  height: DOT,
                  scale: String(interpolate(age, [0, 0.35], [0, 1], { ...clamp, easing: outBack })),
                  opacity: lit ? 1 : 1 - fit * 0.8,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: DOT,
                    backgroundColor: CAT_COLOR[p.category],
                    opacity: 0.15 + halo * 0.25 + (lit ? fit * 0.3 : 0),
                    scale: String(1.15 + halo * 0.25 + (lit ? fit * 0.2 : 0)),
                  }}
                />
                <Avatar person={p} size={DOT} style={{ position: "relative" }} />
              </div>
            );
          })}
        </div>
      </Card>
      <Card style={{ gap: 4 }}>
        <span style={{ ...T.label, marginBottom: 2 }}>People</span>
        {ROOM.slice(0, Math.min(shown, 5)).map((p) => (
          <ListRow
            key={p.id}
            leading={<Avatar person={p} size={36} />}
            title={p.name}
            subtitle={`${p.role} · ${p.company}`}
            trailing={<span style={{ fontFamily: F.regular, fontSize: 11.5, color: C.muted }}>{distance(p)}</span>}
            style={{ opacity: fits.includes(p) ? 1 : 1 - fit * 0.7 }}
          />
        ))}
      </Card>
    </Screen>
  );
};

// ---------------------------------------------------------------- shared pieces

export const AiSummary = ({ host, text, style }: { host: string; text: string; style?: React.CSSProperties }) => (
  <Card style={style}>
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <Inline>
        <Sparkles size={12} color={C.purple} strokeWidth={2} />
        <span style={{ fontFamily: F.medium, fontSize: 10.5, color: C.purple, letterSpacing: 1, textTransform: "uppercase" }}>
          AI summary
        </span>
        <span style={T.sub}>from {host}</span>
      </Inline>
      <span style={{ ...T.body, color: C.muted }}>{text}</span>
    </div>
  </Card>
);

export const DRIFTWOOD =
  "Driftwood lets friends plan and pay for group trips from one shared wallet, settling in stablecoins so nobody chases IOUs.";

const Tags = ({ label, tags, color }: { label: string; tags?: string[]; color: string }) =>
  tags?.length ? (
    <Card>
      <Label>{label}</Label>
      <Row>
        {tags.map((t) => (
          <Chip key={t} label={t} icon={TAG_ICON[t]} selected color={color} />
        ))}
      </Row>
    </Card>
  ) : null;

/** Icebreaker states: the button, the writing shimmer, then the quote typed `words` deep. */
const Icebreaker = ({ state, words, text, shimmer = 0 }: { state: "idle" | "writing" | "done"; words: number; text: string; shimmer?: number }) =>
  state === "done" ? (
    <div
      style={{
        backgroundColor: C.raised,
        border: `1px solid ${C.line}`,
        borderRadius: R.inner,
        padding: 10,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <Inline>
        <MessageCircle size={12} color={C.purple} strokeWidth={2} />
        <span style={{ fontFamily: F.medium, fontSize: 10.5, color: C.purple, letterSpacing: 1, textTransform: "uppercase" }}>
          Say this
        </span>
      </Inline>
      <span style={{ fontFamily: F.medium, fontSize: 15, lineHeight: "23px", color: C.text }}>
        {text.split(" ").map((w, i) => (
          <span key={i} style={{ opacity: interpolate(words - i, [0, 1], [0, 1], clamp) }}>
            {w}{" "}
          </span>
        ))}
      </span>
    </div>
  ) : (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: R.input }}>
      <Button
        title={state === "writing" ? "Writing an icebreaker…" : "Write an icebreaker"}
        icon={Sparkles}
        variant="outline"
        disabled={state === "writing"}
      />
      {state === "writing" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(100deg, transparent 30%, ${C.purple}55 50%, transparent 70%)`,
            translate: `${interpolate(shimmer % 1, [0, 1], [-360, 360])}px 0`,
          }}
        />
      )}
    </div>
  );

// ---------------------------------------------------------------- person

export type PersonState = {
  scroll?: number;
  waved?: boolean;
  met?: "minting" | "minted";
  note?: string;
  noteFocused?: boolean;
  reason?: string;
};

/** Someone's profile (Person modal), or Sam's own pass seen by Priya. */
export const PersonScreen = ({ person, scroll = 0, waved, met, note = "", noteFocused, reason }: { person: Person } & PersonState) => (
  <Screen scroll={scroll} top={20} sheet>
    <Header title="Profile" back />
    <PassCard person={person} status={distance(person.r ? person : PRIYA)}>
      <Row>
        <Chip label={person === SAM ? "driftwood.xyz" : `X @${person.name.split(" ")[0].toLowerCase()}vc`} icon={Globe} selected color={C.text} />
      </Row>
    </PassCard>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 4 }}>
        <Action icon={Hand} color={C.amber} label={waved ? "Waved" : "Wave"} disabled={waved} />
        <Action icon={LocateFixed} color={C.blue} label="Find" />
        <Action icon={met ? Check : Handshake} color={C.green} label={met ? "Met" : "We met"} disabled={!!met} />
      </div>
      {met && (
        <span style={{ ...T.sub, textAlign: "center", color: met === "minted" ? C.text : C.muted }}>
          {met === "minted" ? "You met · stamp minted on Base" : "You met · minting your stamp…"}
        </span>
      )}
    </div>
    {reason && (
      <Card>
        <Inline gap={8}>
          <Sparkles size={14} color={C.purple} strokeWidth={2} />
          <Label>Why talk to them</Label>
        </Inline>
        <span style={T.h2}>{reason}</span>
      </Card>
    )}
    <Card>
      <Field
        label="Private note"
        multiline
        value={note}
        focused={noteFocused}
        placeholder="Only you see this. What you talked about, what to follow up on…"
      />
    </Card>
    {person === SAM && <AiSummary host="driftwood.xyz" text={DRIFTWOOD} />}
    <Card>
      <Label>Building</Label>
      <span style={T.h2}>{person.building}</span>
    </Card>
    <Tags label="Looking for" tags={person.lf} color={C.purple} />
    <Tags label="Can offer" tags={person.of} color={C.green} />
  </Screen>
);

// ---------------------------------------------------------------- AI match

export const MATCHES: [Person, string][] = [
  [PRIYA, "Priya writes first checks into consumer apps, and Driftwood is raising its pre-seed."],
  [LEO, "Leo wants a co-founder and you need devs. Zephyr's cheap proofs fit your shared wallets."],
  [HANA, "Hana designs seedless wallet onboarding, the exact flow Driftwood needs next."],
  [ROOM[3], "Marcus pays remote teams in USDC. Swap notes on stablecoin offramps."],
];

export const LEO_ICEBREAKER = "Leo, could Zephyr prove a group wallet paid its share without an indexer? That's Driftwood's whole problem.";

export const MatchesScreen = ({
  appear,
  scroll,
  leo,
  words = 0,
  shimmer,
}: {
  appear: number;
  scroll: number;
  leo: "idle" | "writing" | "done";
  words?: number;
  shimmer?: number;
}) => (
  <Screen tab={1} scroll={scroll}>
    <Header
      title="AI match"
      right={
        <div style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${C.lineStrong}`, backgroundColor: C.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshCw size={16} color={C.text} strokeWidth={2} />
        </div>
      }
    />
    <span style={{ ...T.title, marginTop: 4 }}>Talk to these first</span>
    {MATCHES.map(([p, reason], i) => {
      const k = interpolate(appear - i * 0.12, [0, 0.45], [0, 1], { ...clamp, easing: outCubic });
      return (
        <div key={p.id} style={{ opacity: k, translate: `0 ${(1 - k) * 40}px` }}>
          <Card>
            <ListRow
              leading={<Avatar person={p} size={38} />}
              title={p.name}
              subtitle={`${p.role} · ${p.company}`}
              trailing={<Tag label={`#${i + 1}`} solid={i === 0} />}
            />
            <span style={{ ...T.h2, lineHeight: "25px" }}>{reason}</span>
            <Icebreaker state={p === LEO ? leo : "idle"} words={words} text={LEO_ICEBREAKER} shimmer={shimmer} />
            <Inline>
              <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: C.green }} />
              <span style={T.sub}>{distance(p)}</span>
            </Inline>
          </Card>
        </div>
      );
    })}
  </Screen>
);

// ---------------------------------------------------------------- edit pass

const ALL_TAGS = ["Investors", "Co-founder", "Devs", "Designers", "Users", "Hiring", "A job", "Grants", "Partnerships", "Alpha", "Frens"];
const ALL_CATS: Category[] = ["builder", "founder", "investor", "designer", "researcher", "bd", "degen"];
export const BIO = "ex-Uber PM, 2x hackathon winner";

const TagPicker = ({ label, selected, color }: { label: string; selected: string[]; color: string }) => (
  <Card>
    <Label>{label}</Label>
    <Row>
      {ALL_TAGS.map((t) => (
        <Chip key={t} label={t} icon={TAG_ICON[t]} selected={selected.includes(t)} color={color} />
      ))}
    </Row>
  </Card>
);

const Social = ({ label, value, focused }: { label: string; value?: string; focused?: boolean }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      height: 36,
      backgroundColor: C.bg,
      borderRadius: R.input,
      border: `1px solid ${focused ? C.muted : C.lineStrong}`,
      paddingLeft: 10,
    }}
  >
    <span style={{ fontFamily: F.medium, fontSize: 13, color: C.muted, width: 76 }}>{label}</span>
    <span style={{ fontFamily: F.regular, fontSize: 14, color: value ? C.text : C.faint }}>
      {value || "@handle"}
      {focused && <span style={{ display: "inline-block", width: 2, height: 17, marginLeft: 1, background: C.blue, verticalAlign: "-3px" }} />}
    </span>
  </div>
);

export type EditorState = {
  scroll?: number;
  website?: string;
  websiteFocused?: boolean;
  seed?: string;
  pop?: number;
  category?: Category;
  bio?: string;
  bioFocused?: boolean;
  lf?: string[];
  of?: string[];
  x?: string;
  xFocused?: boolean;
};

/** The full Edit pass form, as in the app's ProfileEditor. Defaults are Sam's finished pass. */
export const EditorScreen = ({
  scroll = 0,
  website = "",
  websiteFocused,
  seed = SAM.id,
  pop = 0,
  category = "founder",
  bio = BIO,
  bioFocused,
  lf = SAM.lf!,
  of = SAM.of!,
  x = "samokafor",
  xFocused,
}: EditorState) => (
  <Screen scroll={scroll} top={20} sheet>
    <Header title="Edit pass" back />
    <PassCard person={{ ...SAM, category }} seed={seed} pop={pop} status="you" />
    <div style={{ display: "flex", gap: 8 }}>
      <Button title="Add a photo" variant="outline" icon={Camera} style={{ flex: 1 }} />
      <Button title="New avatar" variant="outline" icon={Dices} style={{ flex: 1 }} />
    </div>
    <Card style={{ gap: 12 }}>
      <Field label="Name" value={SAM.name} />
      <Field label="Role" value={SAM.role} />
      <Field label="Company or project" value={SAM.company} />
      <Field label="Website" value={website} placeholder="yourproject.xyz" focused={websiteFocused} />
      <div style={{ display: "flex", gap: 8, marginTop: -4 }}>
        <Sparkles size={12} color={C.purple} strokeWidth={2} style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={T.sub}>
          Claude reads your website and writes a short summary of what your project does. It shows on your pass, labelled as AI.
        </span>
      </div>
    </Card>
    <Card>
      <Label>I'm a</Label>
      <Row>
        {ALL_CATS.map((c) => (
          <Chip key={c} label={CAT_LABEL[c][0]} icon={CAT_ICON[c]} selected={c === category} color={CAT_COLOR[c]} />
        ))}
      </Row>
    </Card>
    <Card style={{ gap: 12 }}>
      <Field label="What I'm building" multiline value={SAM.building!} />
      <Field label="Bio" multiline value={bio} placeholder="ex-Coinbase, 3x hackathon winner, dog dad" focused={bioFocused} />
    </Card>
    <TagPicker label="Looking for" selected={lf} color={C.purple} />
    <TagPicker label="I can offer" selected={of} color={C.green} />
    <Card>
      <Label>Socials</Label>
      <Social label="X" value={x} focused={xFocused} />
      <Social label="Telegram" />
      <Social label="Farcaster" />
      <Social label="GitHub" />
      <Social label="LinkedIn" />
    </Card>
    <Button title="Save" />
  </Screen>
);

// ---------------------------------------------------------------- me

export type MeState = {
  scroll?: number;
  reading?: boolean;
  summary?: number;
  wallet?: "none" | "checking" | "verified";
  verifiedAt?: number;
  amount?: number;
  exact?: number; // 1 = on, 0 = off (animates the switch and the morph)
  met?: boolean;
};

export const MeScreen = ({ scroll = 0, reading, summary = 0, wallet = "none", verifiedAt = 1, amount = 0, exact = 1, met }: MeState) => (
  <Screen tab={3} scroll={scroll}>
    <Header title="My pass" />
    <PassCard person={SAM} status="you">
      <Row>
        <Chip label="driftwood.xyz" icon={Globe} selected color={C.text} />
      </Row>
    </PassCard>
    <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 4 }}>
      <Action icon={PenLine} label="Edit" color={C.blue} />
      <Action icon={Wallet} label="Wallet" color={C.green} />
    </div>
    {reading && (
      <Card>
        <div style={{ display: "flex", gap: 10 }}>
          <Sparkles size={14} color={C.purple} strokeWidth={2} style={{ flexShrink: 0, marginTop: 3 }} />
          <span style={{ ...T.body, flex: 1 }}>Claude is reading driftwood.xyz to summarise what you do…</span>
        </div>
      </Card>
    )}
    {summary > 0 && (
      <AiSummary
        host="driftwood.xyz"
        text={DRIFTWOOD}
        style={{ opacity: summary, translate: `0 ${(1 - summary) * 12}px`, boxShadow: `0 0 ${summary * 24}px ${C.purple}22` }}
      />
    )}
    {wallet === "verified" ? (
      <>
        <Card>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ ...T.label, flex: 1 }}>Net worth</span>
            <Tag label="🐋 Whale" />
            <div style={{ width: 28, height: 28, borderRadius: 16, backgroundColor: C.raised, border: `1px solid ${C.lineStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <RefreshCw size={14} color={C.text} strokeWidth={1.75} />
            </div>
          </div>
          <div style={{ position: "relative", height: 38 }}>
            <span
              style={{
                position: "absolute",
                fontFamily: F.bold,
                fontSize: 30,
                color: C.text,
                letterSpacing: -1.2,
                fontVariantNumeric: "tabular-nums",
                opacity: exact,
                filter: `blur(${(1 - exact) * 8}px)`,
                scale: String(0.9 + exact * 0.1),
                transformOrigin: "left center",
              }}
            >
              {usd(amount)}
            </span>
            <span
              style={{
                position: "absolute",
                fontFamily: F.bold,
                fontSize: 30,
                color: C.text,
                letterSpacing: -1,
                opacity: 1 - exact,
                filter: `blur(${exact * 8}px)`,
                scale: String(1.1 - (1 - exact) * 0.1),
                transformOrigin: "left center",
              }}
            >
              🐋 Whale
            </span>
          </div>
          <Inline>
            <BadgeCheck size={14} color={C.green} strokeWidth={2} />
            <span style={{ ...T.sub, color: C.green }}>1 verified wallet</span>
          </Inline>
        </Card>
        <Card style={{ gap: 4 }}>
          <span style={{ ...T.label, marginBottom: 2 }}>Wallets</span>
          <ListRow
            leading={
              <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.raised, border: `1px solid ${C.lineStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: F.bold, fontSize: 14, color: C.blue }}>Ξ</span>
              </div>
            }
            title="0x71C7…3aF2"
            subtitle="Ethereum · verified"
            trailing={
              <div style={{ position: "relative" }}>
                <Trash2 size={17} color={C.muted} strokeWidth={1.6} />
                <div
                  style={{
                    position: "absolute",
                    right: 24,
                    top: -2,
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: C.green,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    scale: String(interpolate(verifiedAt, [0, 0.3, 0.5, 1], [0, 1.25, 1, 0], clamp)),
                  }}
                >
                  <Check size={13} color={C.ink} strokeWidth={3} />
                </div>
              </div>
            }
          />
          <div style={{ display: "flex", alignItems: "center", paddingTop: 6 }}>
            <span style={{ ...T.body, flex: 1 }}>Show exact amount</span>
            <div style={{ width: 51, height: 31, borderRadius: 16, backgroundColor: exact > 0.5 ? C.green : C.lineStrong, padding: 2 }}>
              <div style={{ width: 27, height: 27, borderRadius: 14, backgroundColor: C.text, translate: `${exact * 20}px 0` }} />
            </div>
          </div>
        </Card>
      </>
    ) : (
      <Card>
        <Inline gap={10}>
          <div style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.raised, border: `1px solid ${C.lineStrong}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={16} color={C.green} strokeWidth={2} />
          </div>
          <span style={T.h2}>Flex your bags</span>
        </Inline>
        <span style={{ ...T.body, color: C.muted }}>
          Connect and sign with an Ethereum or Solana wallet. Your net worth shows on your pass, verified.
        </span>
        <Button title={wallet === "checking" ? "Check your wallet…" : "Connect wallet"} icon={wallet === "checking" ? undefined : Wallet} disabled={wallet === "checking"} />
      </Card>
    )}
    {met && (
      <Card style={{ gap: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
          <span style={{ ...T.label, flex: 1 }}>People you've met</span>
          <Share2 size={13} color={C.muted} strokeWidth={2} />
          <span style={T.label}>Export</span>
        </div>
        <ListRow
          leading={<Avatar person={PRIYA} size={34} />}
          title={PRIYA.name}
          subtitle="Oct 26 · Lattice Ventures"
          trailing={<Tag label="On Base ↗︎" icon={Check} color={C.green} />}
        />
        <ListRow
          leading={<Avatar person={LEO} size={34} />}
          title={LEO.name}
          subtitle="Oct 26 · Zephyr Labs"
          trailing={<Tag label="On Base ↗︎" icon={Check} color={C.green} />}
        />
        <ListRow
          leading={<Avatar person={HANA} size={34} />}
          title={HANA.name}
          subtitle="loved the seedless onboarding demo"
          trailing={<Tag label="Note" icon={StickyNote} color={C.amber} />}
        />
      </Card>
    )}
  </Screen>
);

// ---------------------------------------------------------------- the room

const CATS: [Category, number][] = [
  ["founder", 4],
  ["investor", 3],
  ["builder", 2],
  ["designer", 2],
  ["researcher", 2],
  ["bd", 2],
  ["degen", 1],
];
const WANTS: [string, number][] = [
  ["Investors", 4],
  ["Co-founder", 4],
  ["Partnerships", 4],
  ["Devs", 4],
  ["Users", 3],
  ["Grants", 3],
];
const OFFERS: [string, number][] = [
  ["Alpha", 5],
  ["Partnerships", 4],
  ["Investors", 3],
  ["Devs", 3],
  ["Hiring", 3],
  ["Users", 3],
];
const BOARD = ROOM.filter((p) => p.usd !== undefined).sort((a, b) => b.usd! - a.usd!);
const TOTAL = BOARD.reduce((a, p) => a + p.usd!, 0);

/** The room tab, built up over `t` seconds. */
/** `t`: seconds since the head count started, `w`: since the net worth started. */
export const RoomScreen = ({ t, w, scroll }: { t: number; w: number; scroll: number }) => {
  const people = Math.round(interpolate(t, [0.1, 0.9], [0, 16], { ...clamp, easing: outCubic }));
  const worth = interpolate(w, [0, 1.6], [0, TOTAL], { ...clamp, easing: (k) => 1 - Math.pow(1 - k, 4) });
  return (
    <Screen tab={2} scroll={scroll}>
      <Header title="The room" />
      <Card>
        <Label>People in the room</Label>
        <span style={{ fontFamily: F.bold, fontSize: 36, color: C.text, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>{people}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
          {CATS.map(([cat, n], i) => {
            const k = interpolate(t - i * 0.07, [0.3, 0.9], [0, 1], { ...clamp, easing: outCubic });
            return (
              <div key={cat} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 118, fontFamily: F.medium, fontSize: 13, color: C.text }}>
                  {CAT_LABEL[cat][1]} {CAT_LABEL[cat][0]}
                </span>
                <div style={{ flex: 1, height: 10 }}>
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 5,
                      width: `${Math.max(2, (n / 4) * 100 * k)}%`,
                      backgroundColor: i === 0 ? CAT_COLOR[cat] : C.lineStrong,
                    }}
                  />
                </div>
                <span style={{ width: 24, textAlign: "right", fontFamily: F.bold, fontSize: 13, color: C.text, opacity: k }}>{n}</span>
              </div>
            );
          })}
        </div>
      </Card>
      <div style={{ display: "flex", gap: 12 }}>
        <Card style={{ flex: 1, gap: 4 }}>
          <span style={{ fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.6 }}>{BOARD.length}</span>
          <span style={T.sub}>Verified wallets</span>
        </Card>
        <Card style={{ flex: 1, gap: 4 }}>
          <span style={{ fontFamily: F.bold, fontSize: 22, color: C.text, letterSpacing: -0.6 }}>Investors</span>
          <span style={T.sub}>Most wanted</span>
        </Card>
      </div>
      <Card style={{ gap: 4 }}>
        <Label>Net worth in the room</Label>
        <span style={{ fontFamily: F.bold, fontSize: 36, color: C.text, letterSpacing: -1, fontVariantNumeric: "tabular-nums" }}>
          {money(worth)}
        </span>
        {BOARD.slice(0, 8).map((p, i) => (
          <ListRow
            key={p.id}
            style={{ opacity: interpolate(w - i * 0.15, [0.2, 0.6], [0, 1], clamp), translate: `${interpolate(w - i * 0.15, [0.2, 0.6], [16, 0], { ...clamp, easing: outCubic })}px 0` }}
            leading={<Avatar person={p} size={34} />}
            title={`${i + 1}. ${p.name}`}
            subtitle={`${p.role} · ${p.company}`}
            trailing={
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                <span style={{ fontFamily: F.bold, fontSize: 14, color: C.text }}>{money(p.usd!)}</span>
                <span style={{ fontFamily: F.medium, fontSize: 11.5, color: C.muted }}>
                  {p.usd! >= 1e7 ? "🐋 Whale" : p.usd! >= 1e6 ? "🦈 Shark" : p.usd! >= 1e5 ? "🐬 Dolphin" : "🐟 Fish"}
                </span>
              </div>
            }
          />
        ))}
      </Card>
      <Tags2 title="The room wants" tags={WANTS} color={C.purple} />
      <Tags2 title="The room offers" tags={OFFERS} color={C.green} />
    </Screen>
  );
};

const Tags2 = ({ title, tags, color }: { title: string; tags: [string, number][]; color: string }) => (
  <Card>
    <Label>{title}</Label>
    <Row>
      {tags.map(([t, n], i) => (
        <Chip key={t} label={`${t} · ${n}`} icon={TAG_ICON[t]} selected={i === 0} color={color} />
      ))}
    </Row>
  </Card>
);

// ---------------------------------------------------------------- finder

const STOPS = [C.blue, C.purple, C.orange];
export const heatColor = (h: number) =>
  interpolateColors(h, [0, 0.5, 1], STOPS);

const interpolateColors = (v: number, input: number[], colors: string[]) => {
  const i = v <= input[1] ? 0 : 1;
  const k = Math.min(1, Math.max(0, (v - input[i]) / (input[i + 1] - input[i])));
  const a = colors[i].match(/\w\w/g)!.map((x) => parseInt(x, 16));
  const b = colors[i + 1].match(/\w\w/g)!.map((x) => parseInt(x, 16));
  return `rgb(${a.map((x, j) => Math.round(x + (b[j] - x) * k)).join(",")})`;
};

/** Finder: `heat` 0 … 1, `beat` 0 … 1 through the current pulse. */
export const FinderScreen = ({ heat, beat, label, rssi, trend }: { heat: number; beat: number; label: string; rssi: number; trend?: boolean }) => {
  const color = heatColor(heat);
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: C.bg, padding: "67px 16px 66px", display: "flex", flexDirection: "column" }}>
      <Header
        title="Finder"
        right={
          <div style={{ width: 32, height: 32, borderRadius: 16, border: `1px solid ${C.lineStrong}`, backgroundColor: C.surface, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X size={16} color={C.text} strokeWidth={2} />
          </div>
        }
      />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, marginTop: 12 }}>
        <Label>Looking for</Label>
        <span style={T.title}>{PRIYA.name}</span>
      </div>
      <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 210,
            height: 210,
            borderRadius: 999,
            border: `2px solid ${color}`,
            scale: String(0.5 + heat * 0.55 + beat * (0.1 + heat * 0.25)),
            opacity: 1 - beat,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 150,
            height: 150,
            borderRadius: 999,
            backgroundColor: color,
            scale: String(0.75 + heat * 0.35 + (1 - beat) * 0.04),
            opacity: 0.25 + heat * 0.2,
          }}
        />
        <Avatar person={PRIYA} size={100} style={{ position: "relative" }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: F.bold, fontSize: 30, color: C.text, letterSpacing: -1.2 }}>{label}</span>
        <div style={{ display: "flex", gap: 8 }}>
          {trend && <Tag label="warmer" icon={Flame} color={C.orange} />}
          <Tag label={`${rssi} dBm`} icon={Bluetooth} />
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- overlays

/** The global wave banner, dropping in by `show` (0 … 1). */
export const WaveBanner = ({ from, show }: { from: Person; show: number }) => (
  <div
    style={{
      position: "absolute",
      left: 12,
      right: 12,
      top: 59,
      translate: `0 ${(show - 1) * 140}px`,
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: 8,
      borderRadius: R.card,
      border: `1px solid ${C.lineStrong}`,
      backgroundColor: C.surface,
      boxShadow: "0 12px 40px #000000AA",
    }}
  >
    <Avatar person={from} size={34} />
    <span style={{ flex: 1, color: C.text, fontSize: 14, fontFamily: F.regular }}>
      <span style={{ fontFamily: F.bold }}>{from.name}</span> waved at you
    </span>
    <div style={{ display: "flex", alignItems: "center", gap: 6, height: 32, padding: "0 10px", borderRadius: R.input, border: `1px solid ${C.lineStrong}` }}>
      <Hand size={14} color={C.amber} strokeWidth={2.2} />
      <span style={{ color: C.text, fontSize: 13, fontFamily: F.bold }}>Wave back</span>
    </div>
  </div>
);

/** The meet confirmation sheet on the other phone. */
export const MeetPrompt = ({ from, show }: { from: Person; show: number }) => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${0.6 * Math.min(1, show)})`, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
    <div
      style={{
        margin: "0 12px 50px",
        backgroundColor: C.surface,
        border: `1px solid ${C.lineStrong}`,
        borderRadius: 24,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        scale: String(interpolate(show, [0, 1], [0.6, 1])),
        opacity: Math.min(1, show * 2),
      }}
    >
      <Avatar person={from} size={60} />
      <span style={{ ...T.title, fontSize: 20, textAlign: "center" }}>{from.name} says you just met</span>
      <span style={{ ...T.body, color: C.muted, textAlign: "center" }}>
        Confirm to mint a proof-of-meet stamp on Base, signed by both of you.
      </span>
      <Button title="Confirm & mint" style={{ alignSelf: "stretch" }} />
      <Button title="Not now" variant="outline" style={{ alignSelf: "stretch" }} />
    </div>
  </div>
);

export const EXPORT_TEXT = [
  "People I met at ETHGlobal",
  "",
  "Priya Raman · General Partner, Lattice Ventures",
  "  Met Oct 26 · stamp on Base",
  "  Note: pre-seed, follow up after demo day",
  "",
  "Leo Martins · Protocol Engineer, Zephyr Labs",
  "  Met Oct 26 · stamp on Base",
];

/** iOS share sheet with the export text peeking out, rising by `show` (0 … 1). */
export const ShareSheet = ({ show }: { show: number }) => (
  <div style={{ position: "absolute", inset: 0, backgroundColor: `rgba(0,0,0,${0.5 * show})` }}>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 520,
        translate: `0 ${(1 - show) * 540}px`,
        backgroundColor: "#1C1C1E",
        borderRadius: "14px 14px 0 0",
        padding: "10px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: "-apple-system, 'SF Pro Text', sans-serif",
      }}
    >
      <div style={{ alignSelf: "center", width: 36, height: 5, borderRadius: 3, backgroundColor: "#48484A" }} />
      <div style={{ backgroundColor: "#2C2C2E", borderRadius: 12, padding: 12, display: "flex", flexDirection: "column", gap: 2 }}>
        {EXPORT_TEXT.map((l, i) => (
          <span key={i} style={{ fontSize: 13, lineHeight: "18px", color: i === 0 ? C.text : "#D1D1D6", fontWeight: i === 0 ? 600 : 400, whiteSpace: "pre", minHeight: 8 }}>
            {l}
          </span>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 6px" }}>
        {[
          ["AirDrop", "#0A84FF"],
          ["Messages", "#30D158"],
          ["Mail", "#0A84FF"],
          ["Notes", "#FFD60A"],
          ["Telegram", "#2AABEE"],
        ].map(([n, c]) => (
          <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: c }} />
            <span style={{ fontSize: 11, color: "#D1D1D6" }}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: "#2C2C2E", borderRadius: 12 }}>
        {["Copy", "Save to Files"].map((n, i) => (
          <div key={n} style={{ padding: "13px 14px", fontSize: 16, color: C.text, borderTop: i ? "1px solid #3A3A3C" : "none" }}>
            {n}
          </div>
        ))}
      </div>
    </div>
  </div>
);

