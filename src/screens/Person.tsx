import { useEffect, useState, type ReactNode } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { cachedProfile, fetchProfile, usePeer } from '../peers';
import {
  SOCIALS,
  TAGS,
  type Card,
  type Profile,
  type Social,
} from '../profile';
import { Avatar, CategoryBadge, Chip, Row, tap } from '../ui';
import { BODY, C, CAT_COLOR, H1, H2, LABEL } from '../theme';
import { distanceLabel } from './Radar';
import { NetWorth } from '../NetWorth';
import { shortAddress, verifyWallet } from '../verify';

/** A nearby person: card instantly, full profile from cache, refreshed over the mesh. */
export default function Person({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const peer = usePeer(id);
  const [profile, setProfile] = useState<Profile | undefined>(() =>
    cachedProfile(id),
  );
  const [error, setError] = useState(false);
  useEffect(() => {
    fetchProfile(id).then(
      p => p && setProfile(p),
      () => setError(true),
    );
  }, [id]);

  // Only wallets whose proof names this peer's own address count.
  const verified = profile?.wallets.filter(w => verifyWallet(w, id)) ?? [];
  const tier = peer?.card.tier;

  return (
    <ProfileView
      card={peer?.card}
      profile={profile}
      status={peer ? distanceLabel(peer) : 'out of range'}
      note={
        !profile && error
          ? "Couldn't reach them. Move a little closer."
          : undefined
      }
      onClose={onClose}
      actions={
        verified.length > 0 ? (
          <View style={{ gap: 10 }}>
            <NetWorth
              usd={profile?.netWorthUsd}
              tier={tier}
              verifiedCount={verified.length}
            />
            <Row>
              {verified.map(w => (
                <Chip
                  key={w.address}
                  label={`${w.chain === 'evm' ? 'Ξ' : '◎'} ${shortAddress(
                    w.address,
                  )} ✓`}
                  selected
                  color={C.money}
                />
              ))}
            </Row>
          </View>
        ) : undefined
      }
    />
  );
}

export function ProfileView({
  card,
  profile,
  status,
  note,
  onClose,
  actions,
}: {
  card?: Card;
  profile?: Profile;
  status?: string;
  note?: string;
  onClose?: () => void;
  actions?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const name = profile?.name ?? card?.name ?? '';
  const category = profile?.category ?? card?.category ?? 'builder';
  const role = profile?.role ?? card?.role;
  const company = profile?.company ?? card?.company;
  const socials = Object.entries(profile?.socials ?? {}).filter(
    ([, v]) => v,
  ) as [Social, string][];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      // iOS modals already start below the status bar.
      contentContainerStyle={{
        padding: 20,
        paddingTop: onClose && Platform.OS === 'ios' ? 16 : insets.top + 12,
        paddingBottom: insets.bottom + 120,
        gap: 22,
      }}
    >
      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={() => (tap(), onClose())}
          hitSlop={12}
          style={s.close}
        >
          <Text style={{ color: C.text, fontSize: 18, fontWeight: '900' }}>
            ✕
          </Text>
        </Pressable>
      )}

      <View style={{ alignItems: 'center', gap: 12 }}>
        <Animated.View entering={ZoomIn.springify()}>
          <Avatar
            name={name}
            avatar={profile?.avatar}
            size={148}
            colors={[CAT_COLOR[category], '#FF2E93', '#FF7A18']}
          />
        </Animated.View>
        <Text style={[H1, { textAlign: 'center' }]}>{name}</Text>
        <Text style={[BODY, { color: C.muted, textAlign: 'center' }]}>
          {role}
          {company ? ` @ ${company}` : ''}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <CategoryBadge category={category} />
          {status && <Text style={s.status}>● {status}</Text>}
        </View>
      </View>

      {actions}
      {note && (
        <Text style={[BODY, { color: C.hot, textAlign: 'center' }]}>
          {note}
        </Text>
      )}

      {profile?.building ? (
        <Animated.View entering={FadeInDown.delay(80)} style={s.card}>
          <Text style={LABEL}>Building</Text>
          <Text style={[H2, { fontSize: 20 }]}>{profile.building}</Text>
        </Animated.View>
      ) : null}

      {profile?.bio ? (
        <Animated.View entering={FadeInDown.delay(140)} style={s.card}>
          <Text style={LABEL}>Bio</Text>
          <Text style={BODY}>{profile.bio}</Text>
        </Animated.View>
      ) : null}

      <TagBlock
        label="Looking for"
        tags={profile?.lookingFor ?? card?.lookingFor}
        color={C.hot}
      />
      <TagBlock
        label="Can offer"
        tags={profile?.offering ?? card?.offering}
        color={C.money}
      />

      {socials.length > 0 && (
        <View style={{ gap: 10 }}>
          <Text style={LABEL}>{onClose ? 'Find them' : 'Socials'}</Text>
          {socials.map(([k, handle]) => (
            <Pressable
              key={k}
              accessibilityRole="link"
              onPress={() => (tap(), Linking.openURL(SOCIALS[k].url(handle)))}
              style={({ pressed }) => [
                s.social,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={s.socialLabel}>{SOCIALS[k].label}</Text>
              <Text style={s.socialHandle}>@{handle} ↗</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function TagBlock({
  label,
  tags,
  color,
}: {
  label: string;
  tags?: (keyof typeof TAGS)[];
  color: string;
}) {
  if (!tags?.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={LABEL}>{label}</Text>
      <Row>
        {tags.map(t => (
          <Chip key={t} label={TAGS[t]} selected color={color} />
        ))}
      </Row>
    </View>
  );
}

const s = StyleSheet.create({
  close: {
    alignSelf: 'flex-end',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  status: { color: C.money, fontSize: 13, fontWeight: '800' },
  card: {
    backgroundColor: C.surface,
    borderRadius: 22,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: C.line,
  },
  social: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
  },
  socialLabel: { color: C.muted, fontWeight: '800' },
  socialHandle: { color: C.text, fontWeight: '800' },
});
