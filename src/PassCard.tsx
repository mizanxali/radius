import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Asterisk } from 'lucide-react-native';
import { CATEGORIES, type Category } from './profile';
import { Avatar, CategoryTag } from './ui';
import { C, CAT_COLOR, F, R } from './theme';

/** Everyone's "Radius pass": a black card lit by its category colour. */
export function PassCard({
  id,
  name,
  role,
  company,
  category,
  avatar,
  seed = id,
  status,
  children,
}: {
  id: string;
  name: string;
  role?: string;
  company?: string;
  category: Category;
  avatar?: string;
  seed?: string;
  status?: string;
  children?: ReactNode;
}) {
  const color = CAT_COLOR[category];
  return (
    <View
      style={s.card}
      accessibilityLabel={`${name}, ${role ?? ''}, ${
        CATEGORIES[category].label
      }`}
    >
      {/* soft glow from the top-right corner */}
      <LinearGradient
        colors={[`${color}55`, `${color}00`]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.3, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={s.top}>
        <View style={s.mark}>
          <Asterisk size={16} color={C.text} strokeWidth={2} />
          <Text style={s.brand}>RADIUS</Text>
        </View>
        <CategoryTag category={category} />
      </View>

      <View style={s.who}>
        <Avatar seed={seed} avatar={avatar} size={46} category={category} />
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={s.name} numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </Text>
          {role ? (
            <Text style={s.role} numberOfLines={1}>
              {role}
              {company ? ` · ${company}` : ''}
            </Text>
          ) : null}
        </View>
      </View>

      {children}

      <View style={s.bottom}>
        <Text style={s.id}>
          {id.slice(0, 6)}…{id.slice(-4)}
        </Text>
        {status ? (
          <View style={s.status}>
            <View
              style={[
                s.live,
                {
                  backgroundColor:
                    status === 'out of range' ? C.faint : C.green,
                },
              ]}
            />
            <Text style={s.statusText}>{status}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    borderRadius: R.card + 4,
    borderWidth: 1,
    borderColor: C.lineStrong,
    backgroundColor: C.surface,
    overflow: 'hidden',
    padding: 12,
    gap: 12,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brand: {
    fontFamily: F.xbold,
    fontSize: 11,
    color: C.text,
    letterSpacing: 2,
  },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: {
    fontFamily: F.bold,
    fontSize: 19,
    color: C.text,
    letterSpacing: -0.6,
  },
  role: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  id: {
    fontFamily: F.medium,
    fontSize: 11,
    color: C.faint,
    letterSpacing: 0.5,
  },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  live: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.medium, fontSize: 11, color: C.muted },
});
