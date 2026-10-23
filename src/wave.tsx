import { useEffect, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import Haptics from 'react-native-haptic-feedback';
import { cachedProfile, getMyProfile, handle, request, usePeer } from './peers';
import { Avatar } from './ui';
import { G } from './theme';

type Wave = { from: string; name: string; at: number };
let current: Wave | undefined;
const listeners = new Set<() => void>();
const show = (w: Wave | undefined) => {
  current = w;
  listeners.forEach(l => l());
};

// Incoming: a peer waved. The sender is the SDK-authenticated address, never the body.
handle('wave', (body, sender) => {
  const name = body.slice(0, 40) || 'Someone';
  Haptics.trigger('notificationSuccess');
  show({ from: sender, name, at: Date.now() });
  return 'ok';
});

const lastSent = new Map<string, number>();
/** Waves at a peer, at most once every 20 s each so nobody gets spammed. */
export async function wave(peerId: string) {
  if (Date.now() - (lastSent.get(peerId) ?? 0) < 20_000) return;
  lastSent.set(peerId, Date.now());
  await request(peerId, 'wave', getMyProfile()?.name ?? '', 15_000);
}

export function WaveBanner({ onOpen }: { onOpen: (id: string) => void }) {
  const w = useSyncExternalStore(
    l => (listeners.add(l), () => listeners.delete(l)),
    () => current,
  );
  const insets = useSafeAreaInsets();
  const peer = usePeer(w?.from ?? '');
  useEffect(() => {
    if (!w) return;
    const t = setTimeout(() => show(undefined), 6000);
    return () => clearTimeout(t);
  }, [w]);
  if (!w) return null;
  return (
    <Animated.View
      key={w.at}
      entering={SlideInUp.springify()}
      exiting={SlideOutUp}
      style={[s.wrap, { top: insets.top + 8 }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${w.name} waved at you. Open their profile.`}
        onPress={() => {
          show(undefined);
          onOpen(w.from);
        }}
        style={s.banner}
      >
        <LinearGradient
          colors={G.hot}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Avatar
          name={w.name}
          avatar={cachedProfile(w.from)?.avatar}
          size={48}
          colors={['#fff', '#ffffff88']}
        />
        <Text style={s.text} numberOfLines={2}>
          👋{' '}
          <Text style={{ fontWeight: '900' }}>{peer?.card.name ?? w.name}</Text>{' '}
          waved at you
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    overflow: 'hidden',
  },
  text: { flex: 1, color: '#fff', fontSize: 17, fontWeight: '600' },
});
