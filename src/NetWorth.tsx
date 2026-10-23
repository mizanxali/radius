import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Haptics from 'react-native-haptic-feedback';
import { tierFor } from './profile';
import { C, LABEL } from './theme';

const usdFmt = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

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
      else Haptics.trigger('notificationSuccess');
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
    <Pressable
      accessibilityRole={onRefresh ? 'button' : undefined}
      disabled={!onRefresh}
      onPress={onRefresh}
      style={s.card}
    >
      <LinearGradient
        colors={['#B6FF3B22', '#3BFFB011', '#00000000']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={LABEL}>Net worth {onRefresh ? '· tap to refresh' : ''}</Text>
      {usd != null ? (
        <Text style={s.amount} adjustsFontSizeToFit numberOfLines={1}>
          {usdFmt(shown)}
        </Text>
      ) : (
        <Text style={s.hidden}>amount hidden</Text>
      )}
      <View style={s.row}>
        {label && <Text style={s.tier}>{label}</Text>}
        {verifiedCount > 0 && (
          <Text style={s.verified}>
            ✓ {verifiedCount} verified wallet{verifiedCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 20,
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#B6FF3B66',
    overflow: 'hidden',
    backgroundColor: C.surface,
  },
  amount: {
    color: C.money,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    fontVariant: ['tabular-nums'],
  },
  hidden: { color: C.muted, fontSize: 28, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tier: { color: C.text, fontSize: 18, fontWeight: '900' },
  verified: { color: C.money, fontSize: 13, fontWeight: '800' },
});
