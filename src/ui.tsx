import type { ReactNode } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Haptics from 'react-native-haptic-feedback';
import { C, CAT_COLOR, G } from './theme';
import { CATEGORIES, type Category } from './profile';

export const tap = () => Haptics.trigger('impactLight');

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Photo (or initials) inside a gradient ring. */
export function Avatar({
  name,
  avatar,
  size,
  colors = G.radar,
}: {
  name: string;
  avatar?: string;
  size: number;
  colors?: string[];
}) {
  const ring = Math.max(2, size * 0.05);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          s.avatarInner,
          {
            top: ring,
            left: ring,
            right: ring,
            bottom: ring,
            borderRadius: size / 2,
          },
        ]}
      >
        {avatar ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${avatar}` }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Text
            style={{ color: C.text, fontWeight: '900', fontSize: size * 0.34 }}
          >
            {initials(name) || '?'}
          </Text>
        )}
      </View>
    </View>
  );
}

export function GradientButton({
  title,
  onPress,
  colors = G.hot,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  colors?: string[];
  disabled?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        {
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}
    >
      {/* LinearGradient doesn't lay out children on iOS (Fabric): keep it a background. */}
      <View style={s.btn}>
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        {/* light gradients (money) need dark text to stay readable */}
        <Text style={[s.btnText, colors === G.money && { color: C.bg }]}>
          {title}
        </Text>
      </View>
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  color = '#7B61FF',
  onPress,
}: {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected } : undefined}
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        s.chip,
        selected && { backgroundColor: color + '33', borderColor: color },
      ]}
    >
      <Text style={[s.chipText, selected && { color: C.text }]}>{label}</Text>
    </Pressable>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  const c = CATEGORIES[category];
  return (
    <View
      style={[
        s.badge,
        {
          backgroundColor: CAT_COLOR[category] + '26',
          borderColor: CAT_COLOR[category],
        },
      ]}
    >
      <Text style={[s.badgeText, { color: CAT_COLOR[category] }]}>
        {c.emoji} {c.label}
      </Text>
    </View>
  );
}

export function Row({
  children,
  gap = 8,
}: {
  children: ReactNode;
  gap?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  avatarInner: {
    position: 'absolute',
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  btn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: C.line,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { color: C.muted, fontSize: 14, fontWeight: '700' },
  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 12, fontWeight: '800' },
});
