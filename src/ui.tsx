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
import LinearGradient from 'react-native-linear-gradient';
import Haptics from 'react-native-haptic-feedback';
import {
  Banknote,
  Briefcase,
  ChevronLeft,
  Code,
  Coins,
  Dices,
  Gift,
  Hammer,
  Handshake,
  Megaphone,
  Microscope,
  Palette,
  PartyPopper,
  PenTool,
  Rocket,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react-native';
import { C, CAT_COLOR, CAT_GRADIENT, F, R, T } from './theme';
import { CATEGORIES, type Category, type Tag as TagKey } from './profile';

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

/** Photo, or initials on a category gradient (or a solid colour). */
export function Avatar({
  name,
  avatar,
  size,
  category,
  color = C.raised,
}: {
  name: string;
  avatar?: string;
  size: number;
  category?: Category;
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
      {category && !avatar && (
        <LinearGradient
          colors={CAT_GRADIENT[category]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      {avatar ? (
        <Image
          source={{ uri: `data:image/jpeg;base64,${avatar}` }}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Text
          style={{
            fontFamily: F.bold,
            color: category || color === C.text ? C.ink : C.text,
            fontSize: size * 0.36,
          }}
        >
          {initials(name) || '?'}
        </Text>
      )}
    </View>
  );
}

/** Full-width button: white (primary) or hairline outline. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon: I,
  disabled,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  icon?: Icon;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const primary = variant === 'primary';
  const fg = primary ? C.ink : C.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => (tap(), onPress())}
      style={({ pressed }) => [
        s.button,
        primary ? { backgroundColor: C.text } : s.outline,
        {
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}
    >
      {I && <I size={18} color={fg} strokeWidth={2} />}
      <Text style={[s.buttonText, { color: fg }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Round hairline button with a coloured icon and a caption underneath. */
export function Action({
  icon: I,
  label,
  onPress,
  color = C.text,
  disabled,
}: {
  icon: Icon;
  label: string;
  onPress: () => void;
  color?: string;
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
          opacity: disabled ? 0.4 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <View style={s.actionCircle}>
        <I size={22} color={color} strokeWidth={1.75} />
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
      <I size={18} color={C.text} strokeWidth={2} />
    </Pressable>
  );
}

/** Left-aligned page title, with an optional back button and trailing action. */
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
      {onBack && (
        <IconButton icon={ChevronLeft} label="Back" onPress={onBack} />
      )}
      <Text
        style={[T.header, { flex: 1 }]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Text>
      {right}
    </View>
  );
}

/** Scrollable page on the black background, clear of the notch and tab bar. */
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
  // iOS page-sheet modals already start below the status bar; Android's are full screen
  const sheet = modal && Platform.OS === 'ios';
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: sheet ? 16 : insets.top + 8,
          paddingBottom: insets.bottom + 110,
          gap,
        }}
      >
        {children}
      </ScrollView>
      {!sheet && (
        // Scrolled content fades out under the clock instead of colliding with it.
        <LinearGradient
          pointerEvents="none"
          colors={[C.bg, C.bg, `${C.bg}00`]}
          locations={[0, 0.6, 1]}
          style={[s.scrim, { height: insets.top + 24 }]}
        />
      )}
    </View>
  );
}

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[s.card, style]}>{children}</View>;
}

export const CAT_ICON: Record<Category, Icon> = {
  builder: Hammer,
  founder: Rocket,
  investor: Coins,
  designer: Palette,
  researcher: Microscope,
  bd: Handshake,
  degen: Dices,
};

export const TAG_ICON: Record<TagKey, Icon> = {
  investors: Banknote,
  cofounder: UserPlus,
  devs: Code,
  designers: PenTool,
  users: Users,
  hiring: Megaphone,
  job: Briefcase,
  grants: Gift,
  partners: Handshake,
  alpha: Sparkles,
  frens: PartyPopper,
};

/** Hairline chip; selected turns white and tints its icon. */
export function Chip({
  label,
  icon: I,
  selected,
  color = C.blue,
  onPress,
}: {
  label: string;
  icon?: Icon;
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
      style={[s.chip, selected && s.chipOn]}
    >
      {I && (
        <I size={14} strokeWidth={2.2} color={selected ? color : C.faint} />
      )}
      <Text style={[s.chipText, selected && { color: C.text }]}>{label}</Text>
    </Pressable>
  );
}

/** Small status tag, optionally led by a coloured icon; `solid` is white. */
export function Tag({
  label,
  icon: I,
  color = C.muted,
  solid,
}: {
  label: string;
  icon?: Icon;
  color?: string;
  solid?: boolean;
}) {
  return (
    <View style={[s.tag, solid && { backgroundColor: C.text }]}>
      {I && <I size={12} strokeWidth={2.4} color={color} />}
      <Text style={[s.tagText, solid && { color: C.ink }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

export function CategoryTag({ category }: { category: Category }) {
  return (
    <Tag
      label={CATEGORIES[category].label}
      icon={CAT_ICON[category]}
      color={CAT_COLOR[category]}
    />
  );
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
  scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  button: {
    height: 50,
    borderRadius: R.input,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  outline: { borderWidth: 1, borderColor: C.lineStrong },
  buttonText: { fontFamily: F.bold, fontSize: 16 },
  action: { alignItems: 'center', gap: 8, flex: 1 },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontFamily: F.medium, fontSize: 13, color: C.muted },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    marginBottom: 4,
  },
  card: {
    backgroundColor: C.surface,
    borderRadius: R.card,
    borderWidth: 1,
    borderColor: C.line,
    padding: 18,
    gap: 14,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: C.lineStrong,
    borderRadius: R.chip,
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  chipOn: { borderColor: '#FFFFFF66', backgroundColor: C.raised },
  chipText: { fontFamily: F.medium, fontSize: 14, color: C.muted },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: R.tag,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.raised,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: { fontFamily: F.medium, fontSize: 12, color: C.text },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
});
