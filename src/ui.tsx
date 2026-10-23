import type { ComponentType, ReactNode } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Haptics from 'react-native-haptic-feedback';
import { ChevronLeft } from 'lucide-react-native';
import { C, CAT_COLOR, F, R, T } from './theme';
import { CATEGORIES, type Category } from './profile';

export const tap = () => Haptics.trigger('impactLight');

export type Icon = ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Photo, or initials on a pastel disc. */
export function Avatar({
  name,
  avatar,
  size,
  color = C.blue,
}: {
  name: string;
  avatar?: string;
  size: number;
  color?: string;
}) {
  return (
    <View
      style={[
        s.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
      ]}
    >
      {avatar ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${avatar}` }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Text
          style={{ fontFamily: F.bold, color: C.ink, fontSize: size * 0.36 }}
        >
          {initials(name) || '?'}
        </Text>
      )}
    </View>
  );
}

/** Full-width pill: white (primary), outlined, or a pastel tint. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  tint,
  icon: I,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'tint';
  tint?: string;
  icon?: Icon;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg =
    variant === 'primary'
      ? C.text
      : variant === 'tint'
      ? tint ?? C.blue
      : 'transparent';
  const fg = variant === 'outline' ? C.text : C.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        variant === 'outline' && s.outline,
        style,
      ]}
    >
      {I && <I size={20} color={fg} strokeWidth={1.75} />}
      <Text style={[s.buttonText, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Round icon button with a caption underneath (Lock card / Reissue / Unfreeze). */
export function Action({
  icon: I,
  label,
  onPress,
  active,
  disabled,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [
        s.action,
        {
          opacity: disabled ? 0.45 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <View style={[s.actionCircle, active && { backgroundColor: C.text }]}>
        <I size={24} color={active ? C.ink : C.text} strokeWidth={1.6} />
      </View>
      <Text style={s.actionLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Small round icon button for headers. */
export function IconButton({
  icon: I,
  label,
  onPress,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [s.iconButton, { opacity: pressed ? 0.7 : 1 }]}
    >
      <I size={20} color={C.text} strokeWidth={1.75} />
    </Pressable>
  );
}

/** Centered title between an optional back button and an optional action. */
export function Header({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <View style={s.header}>
      <View style={s.headerSide}>
        {onBack && (
          <IconButton icon={ChevronLeft} label="Back" onPress={onBack} />
        )}
      </View>
      <Text
        style={[T.header, { flex: 1, textAlign: 'center' }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      <View style={[s.headerSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

/** Scrollable page on the charcoal background, clear of the notch and tab bar. */
export function Screen({
  children,
  modal,
  gap = 16,
}: {
  children: ReactNode;
  modal?: boolean;
  gap?: number;
}) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{
        paddingHorizontal: 20,
        // iOS page-sheet modals already start below the status bar; Android's are full screen
        paddingTop: modal && Platform.OS === 'ios' ? 16 : insets.top + 8,
        paddingBottom: insets.bottom + 110,
        gap,
      }}
    >
      {children}
    </ScrollView>
  );
}

export function Card({
  children,
  style,
  tint,
}: {
  children: ReactNode;
  style?: ViewStyle;
  tint?: string;
}) {
  return (
    <View style={[s.card, tint ? { backgroundColor: tint } : null, style]}>
      {children}
    </View>
  );
}

/** Outlined pill; selected fills with a pastel. */
export function Chip({
  label,
  selected,
  color = C.blue,
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
      onPress={() => (tap(), onPress?.())}
      style={[
        s.chip,
        selected && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[s.chipText, selected && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

/** Small filled pill ("Multi-use virtual"). */
export function Tag({
  label,
  color = C.text,
}: {
  label: string;
  color?: string;
}) {
  // White/pastel tags take dark text; the one dark tag colour takes light text.
  const onDark = color === C.raised;
  return (
    <View style={[s.tag, { backgroundColor: color }]}>
      <Text style={[s.tagText, onDark && { color: C.text }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  const c = CATEGORIES[category];
  return <Tag label={`${c.emoji} ${c.label}`} color={CAT_COLOR[category]} />;
}

/** List row: leading avatar, title + subtitle, trailing slot. */
export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
}: {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={() => (tap(), onPress?.())}
      style={({ pressed }) => [s.row, { opacity: pressed ? 0.7 : 1 }]}
    >
      {leading}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={T.strong} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={T.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </Pressable>
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
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  button: {
    height: 58,
    borderRadius: R.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 22,
  },
  outline: { borderWidth: 1.25, borderColor: '#FFFFFFCC' },
  buttonText: { fontFamily: F.medium, fontSize: 18 },
  action: { alignItems: 'center', gap: 10, flex: 1 },
  actionCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: F.regular, fontSize: 15, color: C.text },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.raised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginBottom: 4,
  },
  headerSide: { width: 48 },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    padding: 20,
    gap: 14,
  },
  chip: {
    borderWidth: 1,
    borderColor: '#FFFFFF55',
    borderRadius: R.pill,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  chipText: { fontFamily: F.regular, fontSize: 15, color: C.text },
  tag: {
    borderRadius: R.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
});
