import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { cachedProfile, useMyProfile, usePeers } from '../peers';
import {
  CATEGORIES,
  TAGS,
  tierFor,
  type Card,
  type Category,
  type Tag,
} from '../profile';
import { Avatar } from '../ui';
import { C, CAT_COLOR, G, H1, H2, LABEL } from '../theme';

const money = (n: number) =>
  n >= 1e9
    ? `$${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
    ? `$${(n / 1e6).toFixed(1)}M`
    : n >= 1e3
    ? `$${(n / 1e3).toFixed(0)}K`
    : `$${Math.round(n)}`;

function top<T extends string>(items: T[], n: number) {
  const counts = new Map<T, number>();
  items.forEach(i => counts.set(i, (counts.get(i) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

export default function Room() {
  const insets = useSafeAreaInsets();
  const peers = usePeers();
  const [me] = useMyProfile();

  // The room includes me. My card fields come from my own profile.
  const mine: Card | undefined = me && {
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
    5,
  ) as [Tag, number][];
  const gives = top(
    room.flatMap(c => c.offering),
    5,
  ) as [Tag, number][];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: 120,
        gap: 18,
      }}
    >
      <View>
        <Text style={LABEL}>🏆 The room</Text>
        <Text style={[H1, { marginTop: 4 }]}>
          {room.length} {room.length === 1 ? 'person' : 'people'} here
        </Text>
      </View>

      <View style={s.hero}>
        <LinearGradient
          colors={['#B6FF3B33', '#3BFFB022', '#00000000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={LABEL}>Combined net worth in this room</Text>
        {rich.length > 0 ? (
          <>
            <Text style={s.total} adjustsFontSizeToFit numberOfLines={1}>
              {money(total)}
            </Text>
            <Text style={[LABEL, { color: C.money }]}>
              {rich.length} verified{' '}
              {rich.length === 1 ? 'wallet holder' : 'wallet holders'}
            </Text>
          </>
        ) : (
          <Text style={[H2, { color: C.money }]}>
            Nobody's flexed yet. Connect a wallet on your profile and top the
            leaderboard.
          </Text>
        )}
      </View>

      {rich.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={H2}>🐋 Leaderboard</Text>
          {rich.slice(0, 10).map((c, i) => (
            <Animated.View
              key={c.id}
              entering={FadeInDown.delay(i * 60)}
              style={s.row}
            >
              <Text style={[s.rank, i === 0 && { color: '#FFD23F' }]}>
                {i + 1}
              </Text>
              <Avatar
                name={c.name}
                avatar={
                  c.id === me?.id ? me?.avatar : cachedProfile(c.id)?.avatar
                }
                size={44}
                colors={
                  i === 0
                    ? ['#FFD23F', '#FF7A18']
                    : [CAT_COLOR[c.category], '#ffffff55']
                }
              />
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>
                  {c.name}
                  {c.id === me?.id ? ' (you)' : ''}
                </Text>
                <Text style={s.sub}>{c.tier}</Text>
              </View>
              <Text style={s.amount}>{money(c.netWorthUsd!)}</Text>
            </Animated.View>
          ))}
        </View>
      )}

      <View style={{ gap: 10 }}>
        <Text style={H2}>Who's here</Text>
        {cats.map(([cat, n]) => (
          <Bar
            key={cat}
            label={`${CATEGORIES[cat].emoji} ${CATEGORIES[cat].label}`}
            n={n}
            max={room.length}
            color={CAT_COLOR[cat]}
          />
        ))}
      </View>

      {wants.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={H2}>The room wants</Text>
          {wants.map(([t, n]) => (
            <Bar
              key={t}
              label={TAGS[t]}
              n={n}
              max={room.length}
              color={C.hot}
            />
          ))}
        </View>
      )}
      {gives.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={H2}>The room offers</Text>
          {gives.map(([t, n]) => (
            <Bar
              key={t}
              label={TAGS[t]}
              n={n}
              max={room.length}
              color={C.money}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function Bar({
  label,
  n,
  max,
  color,
}: {
  label: string;
  n: number;
  max: number;
  color: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={s.barLabel}>{label}</Text>
        <Text style={s.barN}>{n}</Text>
      </View>
      <View style={s.track}>
        <LinearGradient
          colors={[color, color + '88']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            width: `${Math.max(6, (n / max) * 100)}%`,
            height: '100%',
            borderRadius: 6,
          }}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  hero: {
    borderRadius: 26,
    padding: 22,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B6FF3B66',
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  total: { color: C.money, fontSize: 56, fontWeight: '900', letterSpacing: -2 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: C.line,
  },
  rank: {
    color: C.muted,
    fontSize: 20,
    fontWeight: '900',
    width: 24,
    textAlign: 'center',
  },
  name: { color: C.text, fontSize: 16, fontWeight: '900' },
  sub: { color: C.muted, fontSize: 13 },
  amount: {
    color: C.money,
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  barLabel: { color: C.text, fontSize: 14, fontWeight: '700' },
  barN: { color: C.muted, fontSize: 14, fontWeight: '800' },
  track: {
    height: 12,
    backgroundColor: C.surface2,
    borderRadius: 6,
    overflow: 'hidden',
  },
});
