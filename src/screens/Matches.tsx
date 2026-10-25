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
import { MessageCircle, RefreshCw, Sparkles } from 'lucide-react-native';
import { cachedProfile, usePeers } from '../peers';
import {
  refreshMatches,
  savedIcebreaker,
  useMatches,
  writeIcebreaker,
} from '../ai';
import type { Match } from '../match';
import { siteHost, type Card as CardT, type Profile } from '../profile';
import {
  Avatar,
  Button,
  Card,
  Header,
  IconButton,
  ListRow,
  Screen,
  Tag,
} from '../ui';
import { C, F, R, T } from '../theme';
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
            size={48}
            category={category}
          />
        }
        title={name}
        subtitle={role}
        trailing={<Tag label={`#${rank}`} solid={rank === 1} />}
        onPress={onPress}
      />
      {p?.summary && <AiSummary summary={p.summary} lines={3} />}
      <Text style={[T.h2, { lineHeight: 25 }]}>{match.reason}</Text>
      {card && <IcebreakerSlot card={card} reason={match.reason} />}
      <View style={s.status}>
        <View style={s.live} />
        <Text style={T.sub}>{status}</Text>
      </View>
    </Card>
  );
}

/** The opener, written by Claude only when asked (one call per tap), then kept. Shared with Person. */
export function IcebreakerSlot({
  card,
  reason,
}: {
  card: CardT;
  reason?: string;
}) {
  const status = useMatches().writing[card.id]; // re-renders when it lands
  const text = savedIcebreaker(card.id);
  if (text) return <Icebreaker text={text} />;
  return (
    <Button
      title={
        status === 'writing'
          ? 'Writing an icebreaker…'
          : status === 'failed'
          ? 'Couldn’t write one. Try again'
          : 'Write an icebreaker'
      }
      icon={Sparkles}
      variant="outline"
      disabled={status === 'writing'}
      onPress={() => writeIcebreaker(card, reason)}
    />
  );
}

/** The line to open with, in a quote panel with a purple label. */
export function Icebreaker({ text }: { text: string }) {
  return (
    <View style={s.bubble}>
      <View style={s.status}>
        <MessageCircle size={14} color={C.purple} strokeWidth={2} />
        <Text style={s.bubbleLabel}>Say this</Text>
      </View>
      <Text style={s.bubbleText}>{text}</Text>
    </View>
  );
}

/** What their project does, written by Claude from their website. Always labelled as AI. */
export function AiSummary({
  summary,
  lines,
}: {
  summary: NonNullable<Profile['summary']>;
  lines?: number;
}) {
  const host = siteHost(summary.url);
  return (
    <View
      accessible
      accessibilityLabel={`AI summary from ${host}: ${summary.text}`}
      style={{ gap: 6 }}
    >
      <View style={s.status}>
        <Sparkles size={14} color={C.purple} strokeWidth={2} />
        <Text style={s.bubbleLabel}>AI summary</Text>
        <Text style={[T.sub, { flex: 1 }]} numberOfLines={1}>
          from {host}
        </Text>
      </View>
      <Text style={[T.body, { color: C.muted }]} numberOfLines={lines}>
        {summary.text}
      </Text>
    </View>
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
          <Bar key={i} h={h} delay={i * 120} highlight={i === 3} />
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
      style={[
        s.bar,
        { backgroundColor: highlight ? C.purple : C.lineStrong },
        style,
      ]}
    />
  );
}

const s = StyleSheet.create({
  bubble: {
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: R.inner,
    padding: 12,
    gap: 4,
  },
  bubbleLabel: {
    fontFamily: F.medium,
    fontSize: 12,
    color: C.purple,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  live: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.green },
  bubbleText: {
    fontFamily: F.medium,
    fontSize: 17,
    lineHeight: 23,
    color: C.text,
  },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 120 },
  bar: { flex: 1, borderRadius: 6 },
});
