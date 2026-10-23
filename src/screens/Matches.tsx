import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { RefreshCw } from 'lucide-react-native';
import { cachedProfile, usePeers } from '../peers';
import { refreshMatches, useMatches } from '../ai';
import type { Match } from '../match';
import { Avatar, Card, Header, IconButton, ListRow, Screen, Tag } from '../ui';
import { C, CAT_COLOR, F, T } from '../theme';
import { distanceLabel } from './Radar';

export default function Matches({ onOpen }: { onOpen: (id: string) => void }) {
  const peers = usePeers();
  const { matches, loading } = useMatches();

  useEffect(() => {
    refreshMatches(peers);
  }, [peers]);

  const byId = new Map(peers.map(p => [p.card.id, p]));
  const shown = matches.filter(m => byId.has(m.id));

  return (
    <Screen>
      <Header
        title="AI match"
        right={
          <IconButton
            icon={RefreshCw}
            label="Re-rank the room"
            onPress={() => refreshMatches(peers, true)}
          />
        }
      />
      <Text style={[T.title, { marginTop: 4 }]}>Talk to these first</Text>

      {loading && <Thinking count={peers.length} />}

      {!loading && shown.length === 0 && (
        <Card>
          <Text style={T.body}>
            {peers.length === 0
              ? 'Nobody around yet. Matches appear as people with Radius come into range.'
              : 'No strong fits in the room right now. Add what you’re looking for to sharpen matches.'}
          </Text>
        </Card>
      )}

      {shown.map((m, i) => (
        <Animated.View
          key={m.id}
          entering={FadeInDown.delay(i * 80).springify()}
        >
          <MatchCard
            rank={i + 1}
            match={m}
            status={distanceLabel(byId.get(m.id)!)}
            onPress={() => onOpen(m.id)}
          />
        </Animated.View>
      ))}

      {!loading && shown.length > 0 && !shown[0].ai && (
        <Text style={[T.sub, { textAlign: 'center' }]}>
          Offline: matched on tags. Reconnect for AI picks.
        </Text>
      )}
    </Screen>
  );
}

function MatchCard({
  rank,
  match,
  status,
  onPress,
}: {
  rank: number;
  match: Match;
  status: string;
  onPress: () => void;
}) {
  const p = cachedProfile(match.id);
  const card = usePeers().find(x => x.card.id === match.id)?.card;
  const name = p?.name ?? card?.name ?? '';
  const category = p?.category ?? card?.category ?? 'builder';
  const role = [p?.role ?? card?.role, p?.company ?? card?.company]
    .filter(Boolean)
    .join(' · ');
  return (
    <Card>
      <ListRow
        leading={
          <Avatar
            name={name}
            avatar={p?.avatar}
            size={52}
            color={CAT_COLOR[category]}
          />
        }
        title={name}
        subtitle={role}
        trailing={<Tag label={`#${rank}`} />}
        onPress={onPress}
      />
      <Text style={[T.h2, { fontSize: 20, lineHeight: 26 }]}>
        {match.reason}
      </Text>
      <View style={s.bubble}>
        <Text style={s.bubbleLabel}>Say this</Text>
        <Text style={s.bubbleText}>{match.icebreaker}</Text>
      </View>
      <Text style={[T.sub, { color: C.mint }]}>● {status}</Text>
    </Card>
  );
}

/** Loading state: chart-like bars breathing while Claude reads the room. */
function Thinking({ count }: { count: number }) {
  return (
    <Card>
      <Text style={T.strong}>
        Reading {count} {count === 1 ? 'profile' : 'profiles'} in the room…
      </Text>
      <View style={s.bars}>
        {[0.5, 0.25, 0.65, 0.9, 0.6, 0.75].map((h, i) => (
          <Bar key={i} h={h} delay={i * 120} highlight={i === 5} />
        ))}
      </View>
    </Card>
  );
}

function Bar({
  h,
  delay,
  highlight,
}: {
  h: number;
  delay: number;
  highlight: boolean;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 700 }), -1, true),
    );
  }, [t, delay]);
  const style = useAnimatedStyle(() => ({
    height: `${(0.35 + t.value * 0.65) * h * 100}%`,
  }));
  return (
    <Animated.View
      style={[s.bar, { backgroundColor: highlight ? C.blue : C.faint }, style]}
    />
  );
}

const s = StyleSheet.create({
  bubble: {
    backgroundColor: C.blueDeep,
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  bubbleLabel: { fontFamily: F.medium, fontSize: 14, color: '#FFFFFFB3' },
  bubbleText: {
    fontFamily: F.medium,
    fontSize: 17,
    lineHeight: 23,
    color: C.text,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 120 },
  bar: { flex: 1, borderRadius: 14 },
});
