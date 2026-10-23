import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Haptics from 'react-native-haptic-feedback';
import { BadgeCheck, RefreshCw } from 'lucide-react-native';
import { tierFor } from './profile';
import { Card, Tag, tap } from './ui';
import { C, F, T } from './theme';

const usdFmt = (n: number) =>
  '$ ' +
  n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/** Rolls the number up from $0 with an ease-out, then thumps. The money shot. */
function useRollUp(target: number, ms = 1800) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      setV(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(step);
      else if (target > 0) Haptics.trigger('notificationSuccess');
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function NetWorth({
  usd,
  tier,
  verifiedCount,
  onRefresh,
}: {
  usd?: number;
  tier?: string;
  verifiedCount: number;
  onRefresh?: () => void;
}) {
  const shown = useRollUp(usd ?? 0);
  const label = tier ?? tierFor(usd);
  if (usd == null && !label) return null;
  return (
    <Card>
      <View style={s.top}>
        <Text style={[T.strong, { flex: 1 }]}>Net worth</Text>
        {label && <Tag label={label} color={C.mint} />}
        {onRefresh && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Refresh net worth"
            hitSlop={10}
            onPress={() => (tap(), onRefresh())}
            style={s.refresh}
          >
            <RefreshCw size={16} color={C.text} strokeWidth={1.75} />
          </Pressable>
        )}
      </View>
      {usd != null ? (
        <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>
          {usdFmt(shown)}
        </Text>
      ) : (
        <Text style={[T.title, { color: C.muted }]}>Amount hidden</Text>
      )}
      {verifiedCount > 0 && (
        <View style={s.verified}>
          <BadgeCheck size={16} color={C.mint} strokeWidth={1.75} />
          <Text style={[T.sub, { color: C.mint }]}>
            {verifiedCount} verified wallet{verifiedCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </Card>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refresh: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontFamily: F.medium,
    fontSize: 42,
    color: C.text,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
