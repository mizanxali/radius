import { useEffect, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { Hand } from 'lucide-react-native';
import Haptics from 'react-native-haptic-feedback';
import {
  avatarSeed,
  cachedProfile,
  getMyProfile,
  handle,
  request,
  usePeer,
} from './peers';
import { Avatar } from './ui';
import { C, F, R } from './theme';

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
        <Avatar
          seed={avatarSeed(w.from)}
          avatar={cachedProfile(w.from)?.avatar}
          size={34}
          category={peer?.card.category}
        />
        <Text style={s.text} numberOfLines={2}>
          <Text style={{ fontFamily: F.bold }}>
            {peer?.card.name ?? w.name}
          </Text>{' '}
          waved at you
        </Text>
        <Hand size={18} color={C.amber} strokeWidth={1.9} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.surface,
  },
  text: { flex: 1, color: C.text, fontSize: 14, fontFamily: F.regular },
});
