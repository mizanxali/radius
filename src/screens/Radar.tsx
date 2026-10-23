import { useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';
import { usePeers, type Peer } from '../peers';
import { cachedProfile } from '../peers';
import { hash, useMyProfile } from '../profile';
import { Avatar, CategoryBadge, tap } from '../ui';
import { BODY, C, CAT_COLOR, G, H1, LABEL } from '../theme';

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

const angleFor = (id: string) =>
  (parseInt(hash(id), 36) % 360) * (Math.PI / 180);

export default function Radar({ onOpen }: { onOpen: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const peers = usePeers();
  const [me] = useMyProfile();
  const size = width - 40;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{
        paddingTop: insets.top + 12,
        paddingBottom: 120,
      }}
    >
      <View style={{ paddingHorizontal: 20 }}>
        <Text style={LABEL}>📡 Radius</Text>
        <Text style={[H1, { marginTop: 4 }]}>
          {peers.length === 0
            ? 'Scanning…'
            : `${peers.length} ${
                peers.length === 1 ? 'person' : 'people'
              } around you`}
        </Text>
      </View>

      <View
        style={{
          width: size,
          height: size,
          alignSelf: 'center',
          marginVertical: 20,
        }}
      >
        <RadarField size={size} />
        <View
          style={[
            StyleSheet.absoluteFill,
            { alignItems: 'center', justifyContent: 'center' },
          ]}
          pointerEvents="none"
        >
          <Avatar
            name={me?.name ?? ''}
            avatar={me?.avatar}
            size={64}
            colors={G.hot}
          />
        </View>
        {peers.map(p => (
          <RadarDot
            key={p.card.id}
            peer={p}
            size={size}
            onPress={() => onOpen(p.card.id)}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 20, gap: 12 }}>
        {peers.map((p, i) => (
          <Animated.View
            key={p.card.id}
            entering={FadeInDown.delay(i * 40).springify()}
          >
            <PeerRow peer={p} onPress={() => onOpen(p.card.id)} />
          </Animated.View>
        ))}
        {peers.length === 0 && (
          <Text
            style={[
              BODY,
              { color: C.muted, textAlign: 'center', marginTop: 8 },
            ]}
          >
            Keep Radius open. People with the app show up here as they come into
            Bluetooth range.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function RadarField({ size }: { size: number }) {
  const sweep = useSharedValue(0);
  const pulse = useSharedValue(0);
  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(360, { duration: 4000, easing: Easing.linear }),
      -1,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.out(Easing.quad) }),
      -1,
    );
  }, [sweep, pulse]);
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sweep.value}deg` }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: 0.5 * (1 - pulse.value),
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[1, 0.7, 0.4].map(f => (
        <View
          key={f}
          style={[
            s.ring,
            {
              width: size * f,
              height: size * f,
              borderRadius: size,
              left: (size * (1 - f)) / 2,
              top: (size * (1 - f)) / 2,
            },
          ]}
        />
      ))}
      <Animated.View
        style={[
          s.pulse,
          { width: size, height: size, borderRadius: size },
          pulseStyle,
        ]}
      />
      <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
        <LinearGradient
          colors={['#7B61FF00', '#7B61FF55', '#FF2E93']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            position: 'absolute',
            left: 0,
            top: size / 2 - 1.5,
            width: size / 2,
            height: 3,
            borderRadius: 2,
          }}
        />
      </Animated.View>
    </View>
  );
}

function RadarDot({
  peer,
  size,
  onPress,
}: {
  peer: Peer;
  size: number;
  onPress: () => void;
}) {
  const dot = 46;
  const a = angleFor(peer.card.id);
  // Keep clear of my avatar (64) in the centre, and inside the outer ring.
  const minR = (64 / 2 + dot / 2 + 6) / (size / 2);
  const fraction = minR + (0.92 - minR) * closeness(peer);
  const r = useSharedValue(fraction);
  useEffect(() => {
    r.value = withSpring(fraction, { damping: 18, stiffness: 60 });
  }, [fraction, r]);
  const style = useAnimatedStyle(() => ({
    left: size / 2 + Math.cos(a) * r.value * (size / 2) - dot / 2,
    top: size / 2 + Math.sin(a) * r.value * (size / 2) - dot / 2,
  }));
  const avatar = cachedProfile(peer.card.id)?.avatar;
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withDelay(
      400,
      withRepeat(withTiming(1, { duration: 1400 }), -1, true),
    );
  }, [glow]);
  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + glow.value * 0.45,
    transform: [{ scale: 1 + glow.value * 0.25 }],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', width: dot, height: dot }, style]}
      entering={ZoomIn.springify()}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: dot, backgroundColor: CAT_COLOR[peer.card.category] },
          glowStyle,
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${peer.card.name}, ${distanceLabel(peer)}`}
        hitSlop={8}
        onPress={() => (tap(), onPress())}
      >
        <Avatar
          name={peer.card.name}
          avatar={avatar}
          size={dot}
          colors={[CAT_COLOR[peer.card.category], '#ffffff']}
        />
      </Pressable>
    </Animated.View>
  );
}

export function PeerRow({
  peer,
  onPress,
}: {
  peer: Peer;
  onPress: () => void;
}) {
  const { card } = peer;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [
        s.row,
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}
    >
      <Avatar
        name={card.name}
        avatar={cachedProfile(card.id)?.avatar}
        size={56}
        colors={[CAT_COLOR[card.category], '#ffffff55']}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.name} numberOfLines={1}>
          {card.name}
        </Text>
        <Text style={s.sub} numberOfLines={1}>
          {card.role}
          {card.company ? ` @ ${card.company}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <CategoryBadge category={card.category} />
          {card.tier && <Text style={s.tier}>{card.tier}</Text>}
        </View>
      </View>
      <Text style={s.dist}>{distanceLabel(peer)}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  ring: { position: 'absolute', borderWidth: 1, borderColor: '#7B61FF33' },
  pulse: { position: 'absolute', borderWidth: 2, borderColor: '#FF2E93' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  name: { color: C.text, fontSize: 18, fontWeight: '900' },
  sub: { color: C.muted, fontSize: 14 },
  tier: { color: C.money, fontSize: 12, fontWeight: '800' },
  dist: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 80,
    textAlign: 'right',
  },
});
