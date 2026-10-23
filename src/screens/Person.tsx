import { useEffect, useState, type ReactNode } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import {
  ArrowUpRight,
  Check,
  Hand,
  Handshake,
  LocateFixed,
  Sparkles,
} from 'lucide-react-native';
import { cachedProfile, fetchProfile, usePeer } from '../peers';
import {
  SOCIALS,
  TAGS,
  type Card as CardT,
  type Profile,
  type Social,
  type Tag as TagT,
} from '../profile';
import { Action, Card, Chip, Header, ListRow, Row, Screen } from '../ui';
import { PassCard } from '../PassCard';
import { NetWorth } from '../NetWorth';
import { useMatches } from '../ai';
import { wave } from '../wave';
import { proposeMeet, useStamps } from '../meet';
import { shortAddress, verifyWallet } from '../verify';
import { distanceLabel } from './Radar';
import { C, F, T } from '../theme';

/** A nearby person: card instantly, full profile from cache, refreshed over the mesh. */
export default function Person({
  id,
  onClose,
  onFind,
}: {
  id: string;
  onClose: () => void;
  onFind: () => void;
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
  const match = useMatches().matches.find(m => m.id === id);
  const stamp = useStamps().find(st => st.peer.id === id);
  const [waved, setWaved] = useState<'sending' | 'sent' | 'failed'>();
  const [meeting, setMeeting] = useState<
    'asking' | 'declined' | 'unreachable'
  >();

  const sendWave = async () => {
    setWaved('sending');
    try {
      await wave(id);
      setWaved('sent');
    } catch {
      setWaved('failed');
    }
  };
  const meet = async () => {
    setMeeting('asking');
    try {
      await proposeMeet(id);
      setMeeting(undefined);
    } catch (e) {
      setMeeting(
        e instanceof Error && /declined|timeout/.test(e.message)
          ? 'declined'
          : 'unreachable',
      );
    }
  };

  const note =
    meeting === 'asking'
      ? 'Waiting for them to confirm on their phone…'
      : meeting === 'declined'
      ? 'They didn’t confirm. Try again?'
      : meeting === 'unreachable' || waved === 'failed'
      ? 'Couldn’t reach them. Move a little closer.'
      : stamp
      ? stamp.status === 'minted'
        ? 'You met · stamp minted on Base'
        : 'You met · minting your stamp…'
      : !profile && error
      ? 'Couldn’t load their profile. Move a little closer.'
      : undefined;

  return (
    <ProfileView
      id={id}
      title="Profile"
      card={peer?.card}
      profile={profile}
      status={peer ? distanceLabel(peer) : 'out of range'}
      onBack={onClose}
      actions={
        peer && (
          <View style={{ gap: 14 }}>
            <View style={s.actions}>
              <Action
                icon={Hand}
                label={waved === 'sent' ? 'Waved' : 'Wave'}
                disabled={waved === 'sending' || waved === 'sent'}
                onPress={sendWave}
              />
              <Action
                icon={LocateFixed}
                label="Find"
                disabled={peer.hops > 0}
                onPress={onFind}
              />
              <Action
                icon={stamp ? Check : Handshake}
                label={stamp ? 'Met' : 'We met'}
                active
                disabled={!!stamp || meeting === 'asking'}
                onPress={meet}
              />
            </View>
            {note && (
              <Text style={[T.sub, { textAlign: 'center' }]}>{note}</Text>
            )}
          </View>
        )
      }
    >
      {match && (
        <Animated.View entering={FadeInDown}>
          <Card>
            <View style={s.inline}>
              <Sparkles size={18} color={C.blue} strokeWidth={1.75} />
              <Text style={T.strong}>Why talk to them</Text>
            </View>
            <Text style={[T.h2, { fontSize: 20, lineHeight: 26 }]}>
              {match.reason}
            </Text>
            <View style={s.bubble}>
              <Text style={s.bubbleLabel}>Say this</Text>
              <Text style={s.bubbleText}>{match.icebreaker}</Text>
            </View>
          </Card>
        </Animated.View>
      )}
      {verified.length > 0 && (
        <>
          <NetWorth
            usd={profile?.netWorthUsd}
            tier={peer?.card.tier}
            verifiedCount={verified.length}
          />
          <Row>
            {verified.map(w => (
              <Chip
                key={w.address}
                label={`${w.chain === 'evm' ? 'Ξ' : '◎'} ${shortAddress(
                  w.address,
                )}`}
              />
            ))}
          </Row>
        </>
      )}
    </ProfileView>
  );
}

/** Pass card, then the profile's sections. Shared by Person and Me. */
export function ProfileView({
  id,
  title,
  card,
  profile,
  status,
  onBack,
  right,
  actions,
  children,
}: {
  id: string;
  title: string;
  card?: CardT;
  profile?: Profile;
  status?: string;
  onBack?: () => void;
  right?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  const name = profile?.name ?? card?.name ?? '';
  const socials = Object.entries(profile?.socials ?? {}).filter(
    ([, v]) => v,
  ) as [Social, string][];
  return (
    <Screen modal={!!onBack}>
      <Header title={title} onBack={onBack} right={right} />
      <PassCard
        id={id}
        name={name}
        role={profile?.role ?? card?.role}
        company={profile?.company ?? card?.company}
        category={profile?.category ?? card?.category ?? 'builder'}
        avatar={profile?.avatar}
        status={status}
      />
      {actions}
      {children}

      {profile?.building ? (
        <Card>
          <Text style={T.label}>Building</Text>
          <Text style={[T.h2, { lineHeight: 28 }]}>{profile.building}</Text>
          {profile.bio ? (
            <Text style={[T.body, { color: C.muted }]}>{profile.bio}</Text>
          ) : null}
        </Card>
      ) : null}

      <Tags
        label="Looking for"
        tags={profile?.lookingFor ?? card?.lookingFor}
        color={C.lilac}
      />
      <Tags
        label="Can offer"
        tags={profile?.offering ?? card?.offering}
        color={C.mint}
      />

      {socials.length > 0 && (
        <Card style={{ gap: 4 }}>
          <Text style={[T.h2, { marginBottom: 6 }]}>Socials</Text>
          {socials.map(([k, handle]) => (
            <ListRow
              key={k}
              leading={
                <View style={s.socialIcon}>
                  <Text style={s.socialLetter}>{SOCIALS[k].label[0]}</Text>
                </View>
              }
              title={SOCIALS[k].label}
              subtitle={`@${handle}`}
              trailing={
                <ArrowUpRight size={20} color={C.muted} strokeWidth={1.75} />
              }
              onPress={() => Linking.openURL(SOCIALS[k].url(handle))}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

function Tags({
  label,
  tags,
  color,
}: {
  label: string;
  tags?: TagT[];
  color: string;
}) {
  if (!tags?.length) return null;
  return (
    <Card>
      <Text style={T.label}>{label}</Text>
      <Row>
        {tags.map(t => (
          <Chip key={t} label={TAGS[t]} selected color={color} />
        ))}
      </Row>
    </Card>
  );
}

const s = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  inline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  bubble: {
    backgroundColor: C.blueDeep,
    borderRadius: 20,
    padding: 16,
    gap: 4,
  },
  bubbleLabel: { fontFamily: F.medium, fontSize: 14, color: '#FFFFFFB3' },
  bubbleText: {
    fontFamily: F.medium,
    fontSize: 17,
    lineHeight: 23,
    color: C.text,
  },
  socialIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLetter: { fontFamily: F.bold, fontSize: 18, color: C.ink },
});
