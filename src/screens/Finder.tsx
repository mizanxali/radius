import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { cachedProfile, usePeer } from '../peers';
import { Avatar, tap } from '../ui';
import { C, H1, LABEL } from '../theme';

/** 0 = far (-90 dBm) … 1 = touching (-40 dBm). */
const heat = (rssi?: number) =>
  rssi == null ? 0 : Math.min(1, Math.max(0, (rssi + 90) / 50));

const COPY: [number, string][] = [
  [0.85, 'Right here 🔥'],
  [0.65, 'Hot'],
  [0.45, 'Warmer…'],
  [0.25, 'Getting warmer'],
  [0, 'Cold. Keep moving'],
];

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

  // Pulse speed and size follow the heat; springs smooth BLE jitter.
  const hv = useSharedValue(h);
  const beat = useSharedValue(0);
  useEffect(() => {
    hv.value = withSpring(h, { damping: 20, stiffness: 50 });
  }, [h, hv]);
  useEffect(() => {
    beat.value = withRepeat(withTiming(1, { duration: 900 }), -1);
  }, [beat]);

  const ring = useAnimatedStyle(() => ({
    transform: [
      // peaks at ~1.45 × 260 pt so it stays on screen
      { scale: 0.5 + hv.value * 0.6 + beat.value * (0.1 + hv.value * 0.25) },
    ],
    opacity: 0.9 - beat.value * 0.7,
    backgroundColor: interpolateColor(
      hv.value,
      [0, 0.5, 1],
      ['#00D4FF', '#7B61FF', '#FF2E93'],
    ),
  }));
  const core = useAnimatedStyle(() => ({
    transform: [{ scale: 0.8 + hv.value * 0.5 }],
    backgroundColor: interpolateColor(
      hv.value,
      [0, 0.5, 1],
      ['#0A3A55', '#3B2A7A', '#FF7A18'],
    ),
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

  const label = peer?.hops
    ? 'Out of Bluetooth range'
    : COPY.find(([min]) => h >= min)![1];

  return (
    <View
      style={[
        s.root,
        { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={() => (tap(), onClose())}
        hitSlop={12}
        style={s.close}
      >
        <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>
          ✕
        </Text>
      </Pressable>
      <Text style={LABEL}>Finding</Text>
      <Text style={H1}>{p?.name ?? peer?.card.name}</Text>

      <View style={s.stage}>
        <Animated.View style={[s.ring, ring]} />
        <Animated.View style={[s.core, core]} />
        <Avatar
          name={p?.name ?? peer?.card.name ?? ''}
          avatar={p?.avatar}
          size={120}
          colors={['#fff', '#ffffff66']}
        />
      </View>

      <Text style={s.heat} accessibilityLiveRegion="polite">
        {peer ? label : 'Lost them…'}
      </Text>
      <Text style={[LABEL, { textAlign: 'center' }]}>
        {peer?.rssi != null ? `${peer.rssi} dBm` : 'listening…'}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, gap: 6 },
  close: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 260, height: 260, borderRadius: 130 },
  core: { position: 'absolute', width: 200, height: 200, borderRadius: 100 },
  heat: {
    color: C.text,
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1,
  },
});
