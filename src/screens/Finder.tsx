import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Haptics from 'react-native-haptic-feedback';
import { Bluetooth, Flame, Snowflake, X } from 'lucide-react-native';
import { cachedProfile, usePeer } from '../peers';
import { Avatar, Header, IconButton, Tag } from '../ui';
import { C, F, T } from '../theme';

/** 0 = far (-90 dBm) … 1 = touching (-40 dBm). */
const heat = (rssi?: number) =>
  rssi == null ? 0 : Math.min(1, Math.max(0, (rssi + 90) / 50));

const COPY: [number, string][] = [
  [0.85, 'Right here'],
  [0.65, 'Hot'],
  [0.45, 'Warmer'],
  [0.25, 'Getting warmer'],
  [0, 'Cold, keep moving'],
];

// cold blue → purple → hot orange
const STOPS = [C.blue, C.purple, C.orange];

export default function Finder({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const peer = usePeer(id);
  const p = cachedProfile(id);
  const h = heat(peer?.rssi);
  const name = p?.name ?? peer?.card.name ?? '';

  // Pulse size and colour follow the heat; springs smooth BLE jitter.
  const hv = useSharedValue(h);
  const beat = useSharedValue(0);
  useEffect(() => {
    hv.value = withSpring(h, { damping: 20, stiffness: 50 });
  }, [h, hv]);
  useEffect(() => {
    beat.value = withRepeat(withTiming(1, { duration: 1000 }), -1);
  }, [beat]);

  const outer = useAnimatedStyle(() => ({
    // peaks at ~1.4 × 240 so it stays on screen
    transform: [
      { scale: 0.5 + hv.value * 0.55 + beat.value * (0.1 + hv.value * 0.25) },
    ],
    opacity: 1 - beat.value,
    borderColor: interpolateColor(hv.value, [0, 0.5, 1], STOPS),
  }));
  const inner = useAnimatedStyle(() => ({
    transform: [{ scale: 0.75 + hv.value * 0.35 }],
    opacity: 0.25 + hv.value * 0.2,
    backgroundColor: interpolateColor(hv.value, [0, 0.5, 1], STOPS),
  }));

  // Geiger-counter haptics: slow ticks when cold, a buzz when you're on top of them.
  const heatRef = useRef(h);
  heatRef.current = h;
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const k = heatRef.current;
      Haptics.trigger(
        k > 0.75 ? 'impactHeavy' : k > 0.4 ? 'impactMedium' : 'impactLight',
      );
      t = setTimeout(tick, 1400 - k * 1250);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  // Direction matters more than distance: compare with ~3 s ago (RSSI is already EMA-smoothed).
  const history = useRef<[number, number][]>([]);
  const now = Date.now();
  if (peer?.rssi != null) {
    history.current = [
      ...history.current.filter(([t]) => now - t < 4000),
      [now, peer.rssi],
    ];
  }
  const delta =
    peer?.rssi != null && history.current[0][0] < now - 2000
      ? peer.rssi - history.current[0][1]
      : 0;
  const trend = delta >= 6 ? 'warmer' : delta <= -6 ? 'colder' : undefined;

  const label = !peer
    ? 'Lost them'
    : peer.hops
    ? 'Out of Bluetooth range'
    : COPY.find(([min]) => h >= min)![1];

  return (
    <View
      style={[
        s.root,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32 },
      ]}
    >
      <Header
        title="Finder"
        right={<IconButton icon={X} label="Close" onPress={onClose} />}
      />
      <View style={s.who}>
        <Text style={T.label}>Looking for</Text>
        <Text style={T.title}>{name}</Text>
      </View>

      <View style={s.stage}>
        <Animated.View style={[s.ring, { width: 240, height: 240 }, outer]} />
        <Animated.View style={[s.circle, { width: 170, height: 170 }, inner]} />
        <Avatar
          name={name}
          avatar={p?.avatar}
          size={120}
          category={peer?.card.category}
        />
      </View>

      <View style={{ alignItems: 'center', gap: 12 }}>
        <Text style={s.heat} accessibilityLiveRegion="polite">
          {label}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {trend && (
            <Tag
              label={trend}
              icon={trend === 'warmer' ? Flame : Snowflake}
              color={trend === 'warmer' ? C.orange : C.blue}
            />
          )}
          <Tag
            label={peer?.rssi != null ? `${peer.rssi} dBm` : 'listening…'}
            icon={Bluetooth}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 16 },
  who: { alignItems: 'center', gap: 4, marginTop: 12 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute', borderRadius: 999 },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 2 },
  heat: {
    fontFamily: F.bold,
    fontSize: 40,
    color: C.text,
    letterSpacing: -1.2,
  },
});
