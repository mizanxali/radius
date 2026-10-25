import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
import { Avatar, tap } from './ui';
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
  // Keyed by the wave it belongs to, so a new wave starts fresh.
  const [back, setBack] = useState<{ at: number; s: 'sending' | 'failed' }>();
  const sending = back?.at === w?.at ? back?.s : undefined;
  useEffect(() => {
    if (!w || sending === 'sending') return; // don't hide mid-send
    const t = setTimeout(() => show(undefined), 6000);
    return () => clearTimeout(t);
  }, [w, sending]);
  if (!w) return null;
  const name = peer?.card.name ?? w.name;

  const waveBack = async () => {
    tap();
    setBack({ at: w.at, s: 'sending' });
    try {
      await wave(w.from);
      show(undefined);
    } catch {
      setBack({ at: w.at, s: 'failed' });
    }
  };
  return (
    <Animated.View
      key={w.at}
      entering={SlideInUp.springify()}
      exiting={SlideOutUp}
      style={[s.wrap, { top: insets.top + 8 }]}
    >
      <View style={s.banner}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${name} waved at you. Open their profile.`}
          onPress={() => {
            show(undefined);
            onOpen(w.from);
          }}
          style={s.open}
        >
          <Avatar
            seed={avatarSeed(w.from)}
            avatar={cachedProfile(w.from)?.avatar}
            size={34}
            category={peer?.card.category}
          />
          <Text style={s.text} numberOfLines={2}>
            <Text style={{ fontFamily: F.bold }}>{name}</Text>{' '}
            {sending === 'failed' ? 'is out of reach' : 'waved at you'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Wave back at ${name}`}
          disabled={sending === 'sending'}
          hitSlop={8}
          onPress={waveBack}
          style={[s.back, sending === 'sending' && { opacity: 0.5 }]}
        >
          <Hand size={14} color={C.amber} strokeWidth={2.2} />
          <Text style={s.backText}>
            {sending === 'failed' ? 'Retry' : 'Wave back'}
          </Text>
        </Pressable>
      </View>
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
    paddingRight: 8,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.surface,
  },
  open: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  text: { flex: 1, color: C.text, fontSize: 14, fontFamily: F.regular },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.lineStrong,
  },
  backText: { color: C.text, fontSize: 13, fontFamily: F.bold },
});
