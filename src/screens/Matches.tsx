import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { cachedProfile, usePeers } from '../peers';
import { refreshMatches, useMatches } from '../ai';
import type { Match } from '../match';
import { Avatar, CategoryBadge, tap } from '../ui';
import { BODY, C, CAT_COLOR, G, H1, LABEL } from '../theme';
import { distanceLabel } from './Radar';

export default function Matches({ onOpen }: { onOpen: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const peers = usePeers();
  const { matches, loading } = useMatches();

  useEffect(() => {
    refreshMatches(peers);
  }, [peers]);

  const byId = new Map(peers.map(p => [p.card.id, p]));
  const shown = matches.filter(m => byId.has(m.id));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
        paddingBottom: 120,
        gap: 14,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        <View style={{ flex: 1 }}>
          <Text style={LABEL}>✨ AI match</Text>
          <Text style={[H1, { marginTop: 4 }]}>Talk to these first</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Re-rank the room"
          disabled={loading}
          hitSlop={10}
          onPress={() => (tap(), refreshMatches(peers, true))}
          style={s.refresh}
        >
          <Text style={{ fontSize: 18 }}>↻</Text>
        </Pressable>
      </View>

      {loading && <Thinking count={peers.length} />}

      {!loading && shown.length === 0 && (
        <Text style={[BODY, { color: C.muted }]}>
          {peers.length === 0
            ? 'Nobody around yet. Matches appear as people with Radius come into range.'
            : 'No strong fits in the room right now. Fill in what you’re looking for to sharpen matches.'}
        </Text>
      )}

      {shown.map((m, i) => (
        <Animated.View
          key={m.id}
          entering={FadeInDown.delay(i * 90).springify()}
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
        <Text style={[LABEL, { textAlign: 'center' }]}>
          Offline: matched on tags. Reconnect for AI picks.
        </Text>
      )}
    </ScrollView>
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
  const peers = usePeers();
  const card = peers.find(x => x.card.id === match.id)?.card;
  const name = p?.name ?? card?.name ?? '';
  const category = p?.category ?? card?.category ?? 'builder';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [
        s.card,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[CAT_COLOR[category] + '33', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <Text style={[s.rank, { color: CAT_COLOR[category] }]}>#{rank}</Text>
        <Avatar
          name={name}
          avatar={p?.avatar}
          size={56}
          colors={[CAT_COLOR[category], '#ffffff55']}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={s.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={s.sub} numberOfLines={1}>
            {p?.role ?? card?.role}
            {p?.company ?? card?.company
              ? ` @ ${p?.company ?? card?.company}`
              : ''}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <CategoryBadge category={category} />
            <Text style={s.status}>● {status}</Text>
          </View>
        </View>
      </View>
      <Text style={s.reason}>{match.reason}</Text>
      <View style={s.bubble}>
        <Text style={LABEL}>Say this</Text>
        <Text style={[BODY, { fontWeight: '600' }]}>“{match.icebreaker}”</Text>
      </View>
    </Pressable>
  );
}

function Thinking({ count }: { count: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [t]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.4 + t.value * 0.6,
    transform: [{ scale: 0.98 + t.value * 0.02 }],
  }));
  return (
    <Animated.View style={[s.thinking, style]}>
      <LinearGradient
        colors={G.radar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={s.thinkingText}>
        Reading {count} {count === 1 ? 'profile' : 'profiles'} in the room…
      </Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.line,
    overflow: 'hidden',
  },
  rank: { fontSize: 28, fontWeight: '900', width: 44 },
  name: { color: C.text, fontSize: 19, fontWeight: '900' },
  sub: { color: C.muted, fontSize: 14 },
  status: { color: C.money, fontSize: 12, fontWeight: '800' },
  reason: { color: C.text, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  bubble: {
    backgroundColor: C.surface2,
    borderRadius: 16,
    padding: 14,
    gap: 6,
  },
  thinking: { borderRadius: 20, padding: 18, overflow: 'hidden' },
  thinkingText: { color: '#fff', fontSize: 16, fontWeight: '900' },
});
