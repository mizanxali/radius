import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { cachedProfile, useMyProfile, usePeers } from '../peers';
import {
  CATEGORIES,
  TAGS,
  tierFor,
  type Card as CardT,
  type Category,
  type Tag as TagT,
} from '../profile';
import { Avatar, Card, Chip, Header, ListRow, Row, Screen, Tag } from '../ui';
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
        <View style={s.top}>
          <Text style={[T.strong, { flex: 1 }]}>Net worth in the room</Text>
          <Tag
            label={`${room.length} ${room.length === 1 ? 'person' : 'people'}`}
          />
        </View>
        {rich.length > 0 ? (
          <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>
            {money(total)}
          </Text>
        ) : (
          <Text style={[T.body, { color: C.muted }]}>
            Nobody's flexed yet. Verify a wallet on your pass to top the board.
          </Text>
        )}
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

      {rich.length > 0 && (
        <Card style={{ gap: 4 }}>
          <Text style={[T.h2, { marginBottom: 6 }]}>Leaderboard</Text>
          {rich.slice(0, 10).map((c, i) => (
            <Animated.View key={c.id} entering={FadeIn.delay(i * 50)}>
              <ListRow
                leading={
                  <Avatar
                    name={c.name}
                    avatar={
                      c.id === me?.id ? me?.avatar : cachedProfile(c.id)?.avatar
                    }
                    size={44}
                    color={i === 0 ? C.butter : CAT_COLOR[c.category]}
                  />
                }
                title={`${i + 1}. ${c.name}${c.id === me?.id ? ' (you)' : ''}`}
                subtitle={c.tier}
                trailing={
                  <Text style={s.rowAmount}>{money(c.netWorthUsd!)}</Text>
                }
              />
            </Animated.View>
          ))}
        </Card>
      )}

      <TagCloud title="The room wants" tags={wants} color={C.lilac} />
      <TagCloud title="The room offers" tags={gives} color={C.mint} />
    </Screen>
  );
}

/** Category mix as the reference's bar chart: grey bars, the biggest in blue with a count pill. */
function Bars({ cats }: { cats: [Category, number][] }) {
  if (!cats.length) return null;
  // Every category gets a slim bar (empty ones as stubs) so the chart keeps its shape.
  const count = new Map(cats);
  const lead = cats[0][0];
  const max = cats[0][1];
  return (
    <View style={s.chart}>
      {(Object.keys(CATEGORIES) as Category[]).map(cat => {
        const n = count.get(cat) ?? 0;
        const isLead = cat === lead;
        return (
          <View
            key={cat}
            style={s.col}
            accessible
            accessibilityLabel={`${CATEGORIES[cat].label}: ${n}`}
          >
            {isLead && (
              <View style={s.pill}>
                <Text style={s.pillText}>{n}</Text>
              </View>
            )}
            <View
              style={[
                s.bar,
                {
                  height: `${8 + (n / max) * 62}%`,
                  backgroundColor: isLead ? C.blue : n ? C.faint : C.raised,
                },
              ]}
            />
            <Text style={s.barLabel}>{CATEGORIES[cat].emoji}</Text>
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
      <Text style={T.h2}>{title}</Text>
      <Row>
        {tags.map(([t, n], i) => (
          <Chip
            key={t}
            label={`${TAGS[t]} · ${n}`}
            selected={i === 0}
            color={color}
          />
        ))}
      </Row>
    </Card>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  amount: {
    fontFamily: F.medium,
    fontSize: 44,
    color: C.text,
    letterSpacing: -0.5,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    height: 180,
    marginTop: 6,
  },
  col: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  bar: { width: '100%', borderRadius: 12 },
  barLabel: { fontSize: 16 },
  pill: {
    backgroundColor: C.text,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  pillText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  pair: { flexDirection: 'row', gap: 12 },
  half: { flex: 1, gap: 4 },
  stat: { fontFamily: F.medium, fontSize: 28, color: C.text },
  rowAmount: {
    fontFamily: F.bold,
    fontSize: 16,
    color: C.text,
    fontVariant: ['tabular-nums'],
  },
});
