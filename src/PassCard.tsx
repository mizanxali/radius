import { StyleSheet, Text, View } from 'react-native';
import { Asterisk } from 'lucide-react-native';
import { CATEGORIES, type Category } from './profile';
import { Avatar, Tag } from './ui';
import { C, CAT_COLOR, F, R } from './theme';

/** The profile as a pastel card: everyone's "Radius pass". */
export function PassCard({
  id,
  name,
  role,
  company,
  category,
  avatar,
  status,
}: {
  id: string;
  name: string;
  role?: string;
  company?: string;
  category: Category;
  avatar?: string;
  status?: string;
}) {
  const color = CAT_COLOR[category];
  const cat = CATEGORIES[category];
  return (
    <View
      style={[s.card, { backgroundColor: color }]}
      accessibilityLabel={`${name}, ${role ?? ''}, ${cat.label}`}
    >
      {/* thin arcs, like the reference card */}
      <View style={[s.arc, { width: 320, height: 320, left: -120, top: 30 }]} />
      <View
        style={[s.arc, { width: 260, height: 260, right: -90, top: -60 }]}
      />

      <View style={s.band}>
        <Asterisk size={30} color="#fff" strokeWidth={1.5} />
        <Tag label={`${cat.emoji} ${cat.label}`} />
      </View>

      <View style={s.body}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={name} avatar={avatar} size={58} color="#FFFFFF88" />
          <View style={{ flex: 1 }}>
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
        <View style={s.bottom}>
          <Text style={s.id}>*{id.slice(-4)}</Text>
          {status ? (
            <View style={s.status}>
              <Text style={s.statusText}>{status}</Text>
            </View>
          ) : null}
          <Text style={s.brand}>RADIUS</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: R.card, overflow: 'hidden' },
  arc: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FFFFFF66',
  },
  band: {
    backgroundColor: '#1E1E22',
    height: 58,
    marginTop: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  body: { padding: 20, paddingTop: 18, gap: 22 },
  name: { fontFamily: F.bold, fontSize: 26, color: C.ink },
  role: { fontFamily: F.medium, fontSize: 15, color: '#1E1E22AA' },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  id: { fontFamily: F.bold, fontSize: 20, color: '#fff' },
  status: {
    backgroundColor: '#FFFFFF55',
    borderRadius: R.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  statusText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  brand: {
    fontFamily: F.xbold,
    fontSize: 22,
    color: '#fff',
    letterSpacing: 0.5,
  },
});
