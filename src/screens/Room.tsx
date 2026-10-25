import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { avatarSeed, cachedProfile, useMyProfile, usePeers } from '../peers';
import {
  CATEGORIES,
  TAGS,
  tierFor,
  type Card as CardT,
  type Category,
  type Tag as TagT,
} from '../profile';
import {
  Avatar,
  Card,
  Chip,
  Header,
  ListRow,
  Row,
  Screen,
  TAG_ICON,
} from '../ui';
import { C, CAT_COLOR, F, T } from '../theme';

const money = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
    ? `$${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
    ? `$${(n / 1e3).toFixed(0)}K`
    : `$${Math.round(n)}`;

function top<K extends string>(items: K[], n: number) {
  const counts = new Map<K, number>();
  items.forEach(i => counts.set(i, (counts.get(i) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default function Room() {
  const peers = usePeers();
  const [me] = useMyProfile();

  // The room includes me; my card fields come from my own profile.
  const mine: CardT | undefined = me && {
    id: me.id,
    name: me.name,
    role: me.role,
    company: me.company,
    category: me.category,
    lookingFor: me.lookingFor,
    offering: me.offering,
    netWorthUsd: me.hideExactNetWorth ? undefined : me.netWorthUsd,
    tier: tierFor(me.netWorthUsd),
    verified: me.wallets.length > 0,
  };
  const room = [...(mine ? [mine] : []), ...peers.map(p => p.card)];
  const total = room.reduce((a, c) => a + (c.netWorthUsd ?? 0), 0);
  const rich = room
    .filter(c => c.netWorthUsd != null)
    .sort((a, b) => b.netWorthUsd! - a.netWorthUsd!);
  // Top 10, plus my own row (with my real rank) when I'm further down.
  const ranked = rich.map((c, i) => [c, i] as const);
  const board = ranked.filter(([c, i]) => i < 10 || c.id === me?.id);
  const cats = top(
    room.map(c => c.category),
    7,
  ) as [Category, number][];
  const wants = top(
    room.flatMap(c => c.lookingFor),
    6,
  ) as [TagT, number][];
  const gives = top(
    room.flatMap(c => c.offering),
    6,
  ) as [TagT, number][];

  return (
    <Screen>
      <Header title="The room" />

      <Card>
        <Text style={T.label}>People in the room</Text>
        <Text style={s.amount}>{room.length}</Text>
        <Bars cats={cats} />
      </Card>

      <View style={s.pair}>
        <Card style={s.half}>
          <Text style={s.stat}>{rich.length}</Text>
          <Text style={T.sub}>Verified wallets</Text>
        </Card>
        <Card style={s.half}>
          <Text style={s.stat} numberOfLines={1} adjustsFontSizeToFit>
            {wants[0] ? TAGS[wants[0][0]] : '—'}
          </Text>
          <Text style={T.sub}>Most wanted</Text>
        </Card>
      </View>

      <Card style={{ gap: 4 }}>
        <Text style={T.label}>Net worth in the room</Text>
        {rich.length > 0 ? (
          <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>
            {money(total)}
          </Text>
        ) : (
          <Text style={[T.body, { color: C.muted }]}>
            Nobody's flexed yet. Verify a wallet on your pass to top the board.
          </Text>
        )}
        {board.map(([c, i]) => (
          <Animated.View key={c.id} entering={FadeIn.delay(i * 50)}>
            <ListRow
              leading={
                <Avatar
                  seed={avatarSeed(c.id)}
                  avatar={
                    c.id === me?.id ? me?.avatar : cachedProfile(c.id)?.avatar
                  }
                  size={34}
                  category={c.category}
                />
              }
              title={`${i + 1}. ${c.name}${c.id === me?.id ? ' (you)' : ''}`}
              subtitle={[c.role, c.company].filter(Boolean).join(' · ')}
              trailing={
                <View style={s.rowEnd}>
                  <Text style={s.rowAmount}>{money(c.netWorthUsd!)}</Text>
                  {c.tier ? <Text style={s.tier}>{c.tier}</Text> : null}
                </View>
              }
            />
          </Animated.View>
        ))}
      </Card>

      <TagCloud title="The room wants" tags={wants} color={C.purple} />
      <TagCloud title="The room offers" tags={gives} color={C.green} />
    </Screen>
  );
}

/** Category mix: one labelled row per category with its count, the biggest lit in its colour. */
function Bars({ cats }: { cats: [Category, number][] }) {
  if (!cats.length) return null;
  // Every category gets a row (empty ones as stubs) so the chart keeps its shape.
  const count = new Map(cats);
  const lead = cats[0][0];
  const max = cats[0][1];
  const all = (Object.keys(CATEGORIES) as Category[]).sort(
    (a, b) => (count.get(b) ?? 0) - (count.get(a) ?? 0),
  );
  return (
    <View style={s.chart}>
      {all.map(cat => {
        const n = count.get(cat) ?? 0;
        const isLead = cat === lead;
        return (
          <View key={cat} style={s.barRow}>
            <Text style={s.barLabel} numberOfLines={1}>
              {CATEGORIES[cat].emoji} {CATEGORIES[cat].label}
            </Text>
            <View style={s.track}>
              <View
                style={[
                  s.bar,
                  {
                    width: `${Math.max(2, (n / max) * 100)}%`,
                    backgroundColor: isLead
                      ? CAT_COLOR[cat]
                      : n
                      ? C.lineStrong
                      : C.raised,
                  },
                ]}
              />
            </View>
            <Text style={[s.barCount, !n && { color: C.muted }]}>{n}</Text>
          </View>
        );
      })}
    </View>
  );
}

function TagCloud({
  title,
  tags,
  color,
}: {
  title: string;
  tags: [TagT, number][];
  color: string;
}) {
  if (!tags.length) return null;
  return (
    <Card>
      <Text style={T.label}>{title}</Text>
      <Row>
        {tags.map(([t, n], i) => (
          <Chip
            key={t}
            label={`${TAGS[t]} · ${n}`}
            icon={TAG_ICON[t]}
            selected={i === 0}
            color={color}
          />
        ))}
      </Row>
    </Card>
  );
}

const s = StyleSheet.create({
  amount: {
    fontFamily: F.bold,
    fontSize: 36,
    color: C.text,
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  chart: { gap: 8, marginTop: 6 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 118, fontFamily: F.medium, fontSize: 13, color: C.text },
  track: { flex: 1, height: 10 },
  bar: { height: '100%', borderRadius: 5 },
  barCount: {
    width: 24,
    textAlign: 'right',
    fontFamily: F.bold,
    fontSize: 13,
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, gap: 4 },
  stat: {
    fontFamily: F.bold,
    fontSize: 22,
    color: C.text,
    letterSpacing: -0.6,
  },
  rowEnd: { alignItems: 'flex-end', gap: 2 },
  tier: { fontFamily: F.medium, fontSize: 11.5, color: C.muted },
  rowAmount: {
    fontFamily: F.bold,
    fontSize: 14,
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
});
