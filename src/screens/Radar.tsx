import { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import {
  avatarSeed,
  cachedProfile,
  useMyProfile,
  usePeers,
  type Peer,
} from '../peers';
import { CATEGORIES, hash, type Category } from '../profile';
import { Radio, Target, Users } from 'lucide-react-native';
import {
  Avatar,
  CAT_ICON,
  Card,
  Chip,
  Header,
  ListRow,
  Screen,
  Tag,
  tap,
} from '../ui';
import { C, CAT_COLOR, F, T } from '../theme';

/** 0 = touching (-35 dBm) … 1 = the rim (-90 dBm). Mesh-only peers sit on the rim. */
export function closeness(p: Peer) {
  if (p.hops > 0) return 1;
  if (p.rssi == null) return 0.6;
  return Math.min(1, Math.max(0, (-p.rssi - 35) / 55));
}

export function distanceLabel(p: Peer) {
  if (p.hops > 0) return `via mesh · ${p.hops} hop${p.hops > 1 ? 's' : ''}`;
  if (p.rssi == null) return 'nearby';
  if (p.rssi >= -50) return 'right next to you';
  if (p.rssi >= -65) return 'a few steps away';
  if (p.rssi >= -78) return 'nearby';
  return 'across the room';
}

/** Even spacing in a stable (hash) order, so a crowd fans out instead of clumping. */
function angles(peers: Peer[]) {
  const order = peers
    .map(p => p.card.id)
    .sort((a, b) => (hash(a) < hash(b) ? -1 : 1));
  return new Map(
    order.map((id, i) => [id, (i / order.length) * 2 * Math.PI - Math.PI / 2]),
  );
}

/** Wants something I offer, or offers something I want. */
const fits = (p: Peer, lf: string[] = [], of: string[] = []) =>
  p.card.lookingFor.some(t => of.includes(t)) ||
  p.card.offering.some(t => lf.includes(t));

export default function Radar({ onOpen }: { onOpen: (id: string) => void }) {
  const { width } = useWindowDimensions();
  const everyone = usePeers();
  const [me] = useMyProfile();
  const [filter, setFilter] = useState<Category | 'fit'>();
  const present = (Object.keys(CATEGORIES) as Category[]).filter(c =>
    everyone.some(p => p.card.category === c),
  );
  // A filter whose category walked off (or a room of one) quietly turns off.
  const active =
    everyone.length > 1 &&
    (filter === 'fit' || present.includes(filter as Category))
      ? filter
      : undefined;
  const toggle = (f: typeof filter) => setFilter(active === f ? undefined : f);
  const peers = everyone.filter(p =>
    !active
      ? true
      : active === 'fit'
      ? fits(p, me?.lookingFor, me?.offering)
      : p.card.category === active,
  );
  const size = width - 60; // 16 px screen + 12 px card padding + border, each side
  const angle = angles(peers);
  const dot = peers.length > 8 ? 30 : 36;

  return (
    <Screen>
      <Header title="Around you" />
      {everyone.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
        >
          <Chip
            label="Good fit"
            icon={Target}
            color={C.purple}
            selected={active === 'fit'}
            onPress={() => toggle('fit')}
          />
          {present.map(c => (
            <Chip
              key={c}
              label={CATEGORIES[c].label}
              icon={CAT_ICON[c]}
              color={CAT_COLOR[c]}
              selected={active === c}
              onPress={() => toggle(c)}
            />
          ))}
        </ScrollView>
      )}
      <Card>
        <View style={s.cardTop}>
          <Text style={[T.label, { flex: 1 }]}>Nearby</Text>
          <Tag
            label={
              active
                ? `${peers.length} of ${everyone.length}`
                : peers.length
                ? `${peers.length} ${peers.length === 1 ? 'person' : 'people'}`
                : 'Scanning'
            }
            icon={everyone.length ? Users : Radio}
            color={everyone.length ? C.green : C.faint}
          />
        </View>
        <View
          style={{
            width: size,
            height: size,
            alignSelf: 'center',
            marginVertical: 4,
          }}
        >
          <RadarField size={size} />
          <View
            style={[StyleSheet.absoluteFill, s.center]}
            pointerEvents="none"
          >
            <View style={s.meRing}>
              <Avatar
                seed={me?.avatarSeed ?? me?.id ?? ''}
                avatar={me?.avatar}
                size={46}
                category={me?.category}
              />
            </View>
          </View>
          {peers.map(p => (
            <RadarDot
              key={p.card.id}
              peer={p}
              size={size}
              angle={angle.get(p.card.id)!}
              dot={dot}
              onPress={() => onOpen(p.card.id)}
            />
          ))}
        </View>
      </Card>

      <Card style={{ gap: 4 }}>
        <Text style={[T.label, { marginBottom: 2 }]}>People</Text>
        {active && peers.length === 0 && (
          <Text style={[T.sub, { paddingVertical: 8 }]}>
            Nobody nearby matches this filter yet.
          </Text>
        )}
        {everyone.length === 0 && (
          <Text style={[T.sub, { paddingVertical: 8 }]}>
            Keep Radius open. People with the app show up here as they come into
            Bluetooth range.
          </Text>
        )}
        {peers.map(p => (
          <Animated.View key={p.card.id} entering={FadeIn}>
            <ListRow
              leading={
                <Avatar
                  seed={avatarSeed(p.card.id)}
                  avatar={cachedProfile(p.card.id)?.avatar}
                  size={36}
                  category={p.card.category}
                />
              }
              title={p.card.name}
              subtitle={[p.card.role, p.card.company]
                .filter(Boolean)
                .join(' · ')}
              trailing={
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  {p.card.tier ? (
                    <Text style={s.tier}>{p.card.tier}</Text>
                  ) : null}
                  <Text style={s.dist}>{distanceLabel(p)}</Text>
                </View>
              }
              onPress={() => onOpen(p.card.id)}
            />
          </Animated.View>
        ))}
      </Card>
    </Screen>
  );
}

function RadarField({ size }: { size: number }) {
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(360, { duration: 4500, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2800, easing: Easing.out(Easing.quad) }),
      -1,
    );
  }, [sweep, pulse]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweep.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.2 + pulse.value * 0.8 }],
    opacity: 0.12 * (1 - pulse.value),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[1, 0.68, 0.36].map(f => (
        <View
          key={f}
          style={[
            s.ring,
            {
              width: size * f,
              height: size * f,
              left: (size * (1 - f)) / 2,
              top: (size * (1 - f)) / 2,
            },
          ]}
        />
      ))}
      <Animated.View
        style={[s.pulse, { width: size, height: size }, pulseStyle]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <LinearGradient
          colors={['#FFFFFF00', '#FFFFFFB3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            left: 0,
            top: size / 2 - 1,
            width: size / 2,
            height: 2,
            borderRadius: 1,
          }}
        />
      </Animated.View>
    </View>
  );
}

function RadarDot({
  peer,
  size,
  angle,
  dot,
  onPress,
}: {
  peer: Peer;
  size: number;
  angle: number;
  dot: number;
  onPress: () => void;
}) {
  const a = useSharedValue(angle);
  useEffect(() => {
    // Turn the short way round when the crowd re-spaces.
    const t = 2 * Math.PI;
    const d = ((((angle - a.value + Math.PI) % t) + t) % t) - Math.PI;
    a.value = withSpring(a.value + d, { damping: 18, stiffness: 60 });
  }, [angle, a]);
  // Keep clear of my avatar (46 + ring) in the centre, and inside the outer ring.
  const minR = (56 / 2 + dot / 2 + 6) / (size / 2);
  const fraction = minR + (0.9 - minR) * closeness(peer);
  const r = useSharedValue(fraction);
  useEffect(() => {
    r.value = withSpring(fraction, { damping: 18, stiffness: 60 });
  }, [fraction, r]);
  const style = useAnimatedStyle(() => ({
    left: size / 2 + Math.cos(a.value) * r.value * (size / 2) - dot / 2,
    top: size / 2 + Math.sin(a.value) * r.value * (size / 2) - dot / 2,
  }));
  const halo = useSharedValue(0);
  useEffect(() => {
    halo.value = withDelay(
      300,
      withRepeat(withTiming(1, { duration: 1600 }), -1, true),
    );
  }, [halo]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + halo.value * 0.25,
    transform: [{ scale: 1.15 + halo.value * 0.25 }],
  }));
  const color = CAT_COLOR[peer.card.category];

  return (
    <Animated.View
      style={[{ position: 'absolute', width: dot, height: dot }, style]}
      entering={ZoomIn.springify()}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: dot, backgroundColor: color },
          haloStyle,
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${peer.card.name}, ${distanceLabel(peer)}`}
        hitSlop={8}
        onPress={() => (tap(), onPress())}
      >
        <Avatar
          seed={avatarSeed(peer.card.id)}
          avatar={cachedProfile(peer.card.id)?.avatar}
          size={dot}
          category={peer.card.category}
        />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  meRing: {
    padding: 4,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.bg,
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.line,
  },
  pulse: { position: 'absolute', borderRadius: 999, backgroundColor: C.text },
  tier: { fontFamily: F.medium, fontSize: 11.5, color: C.text },
  dist: { fontFamily: F.regular, fontSize: 11.5, color: C.muted },
});
