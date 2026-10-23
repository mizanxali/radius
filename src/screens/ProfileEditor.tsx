import { useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { Asterisk, Camera, ChevronRight } from 'lucide-react-native';
import {
  CATEGORIES,
  SOCIALS,
  TAGS,
  type Category,
  type Profile,
  type Social,
  type Tag,
} from '../profile';
import { publishCard, useMyAddress, useMyProfile } from '../peers';
import { Button, Card, Chip, Header, Row, Screen } from '../ui';
import { PassCard } from '../PassCard';
import { C, CAT_COLOR, F, R, T } from '../theme';

const blank: Omit<Profile, 'id'> = {
  name: '',
  role: '',
  category: 'builder',
  bio: '',
  building: '',
  lookingFor: [],
  offering: [],
  socials: {},
  wallets: [],
};

export default function ProfileEditor({ onDone }: { onDone: () => void }) {
  const [saved] = useMyProfile();
  const [started, setStarted] = useState(!!saved);
  return started ? (
    <Editor onDone={onDone} />
  ) : (
    <Welcome onStart={() => setStarted(true)} />
  );
}

/** First launch: the brand moment, then straight into building your pass. */
function Welcome({ onStart }: { onStart: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        s.welcome,
        { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Animated.View entering={FadeInDown.springify()}>
        <Asterisk size={56} color={C.text} strokeWidth={1.75} />
        <Text style={s.brand}>Radius</Text>
        <Text
          style={[
            T.body,
            { fontSize: 18, lineHeight: 25, marginTop: 10, maxWidth: 300 },
          ]}
        >
          See who's around you at the event, and meet the people worth meeting.
        </Text>
      </Animated.View>
      <Animated.View entering={FadeIn.delay(250)} style={s.tilt}>
        <PassCard
          id="off1radius0000"
          name="Your name here"
          role="Builder · ETHGlobal"
          category="designer"
          status="nearby"
        />
      </Animated.View>
      <Button
        title="Get started"
        icon={ChevronRight}
        onPress={onStart}
        style={s.start}
      />
    </View>
  );
}

function Editor({ onDone }: { onDone: () => void }) {
  const [saved, save] = useMyProfile();
  const me = useMyAddress();
  const [p, setP] = useState<Omit<Profile, 'id'>>(saved ?? blank);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) =>
    setP(prev => ({ ...prev, [k]: v }));
  const toggle = (k: 'lookingFor' | 'offering', t: Tag) =>
    set(k, p[k].includes(t) ? p[k].filter(x => x !== t) : [...p[k], t]);

  const pickPhoto = async () => {
    // 256 px at q0.6 lands around 10–15 KB: one BLE round trip, well under the 64 KiB cap.
    const r = await launchImageLibrary({
      mediaType: 'photo',
      maxWidth: 256,
      maxHeight: 256,
      quality: 0.6,
      includeBase64: true,
    });
    const b64 = r.assets?.[0]?.base64;
    if (b64) set('avatar', b64);
  };

  const ready = !!(p.name.trim() && p.role.trim() && p.building.trim() && me);
  const submit = async () => {
    save({ ...p, id: me, name: p.name.trim(), role: p.role.trim() });
    await publishCard();
    onDone();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen modal={!!saved}>
        <Header
          title={saved ? 'Edit pass' : 'Your pass'}
          onBack={saved ? onDone : undefined}
        />
        <PassCard
          id={me || 'off1…'}
          name={p.name || 'Your name'}
          role={p.role || 'Your role'}
          company={p.company}
          category={p.category}
          avatar={p.avatar}
        />
        <Button
          title={p.avatar ? 'Change photo' : 'Add a photo'}
          variant="outline"
          icon={Camera}
          onPress={pickPhoto}
        />

        <Card>
          <Field
            label="Name"
            value={p.name}
            onChangeText={v => set('name', v)}
            placeholder="Vitalik"
          />
          <Field
            label="Role"
            value={p.role}
            onChangeText={v => set('role', v)}
            placeholder="Founder & CEO"
          />
          <Field
            label="Company or project"
            value={p.company ?? ''}
            onChangeText={v => set('company', v || undefined)}
            placeholder="Optional"
          />
        </Card>

        <Card>
          <Text style={T.label}>I'm a</Text>
          <Row>
            {(Object.keys(CATEGORIES) as Category[]).map(c => (
              <Chip
                key={c}
                label={CATEGORIES[c].label}
                selected={p.category === c}
                color={CAT_COLOR[c]}
                onPress={() => set('category', c)}
              />
            ))}
          </Row>
        </Card>

        <Card>
          <Field
            label="What I'm building"
            value={p.building}
            onChangeText={v => set('building', v)}
            placeholder="A gasless wallet for the next billion users"
            multiline
          />
          <Field
            label="Bio"
            value={p.bio}
            onChangeText={v => set('bio', v)}
            placeholder="ex-Coinbase, 3x hackathon winner, dog dad"
            multiline
          />
        </Card>

        <TagPicker
          label="Looking for"
          selected={p.lookingFor}
          color={C.purple}
          onToggle={t => toggle('lookingFor', t)}
        />
        <TagPicker
          label="I can offer"
          selected={p.offering}
          color={C.green}
          onToggle={t => toggle('offering', t)}
        />

        <Card>
          <Text style={T.label}>Socials</Text>
          {(Object.keys(SOCIALS) as Social[]).map(k => (
            <View key={k} style={s.social}>
              <Text style={s.socialLabel}>{SOCIALS[k].label}</Text>
              <TextInput
                accessibilityLabel={`${SOCIALS[k].label} handle`}
                style={s.socialInput}
                value={p.socials[k] ?? ''}
                onChangeText={v =>
                  set('socials', {
                    ...p.socials,
                    [k]: v.replace(/^@/, '').trim() || undefined,
                  })
                }
                placeholder="@handle"
                placeholderTextColor={C.faint}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </Card>

        <Button
          title={saved ? 'Save' : 'Continue'}
          disabled={!ready}
          onPress={submit}
        />
        {!ready && (
          <Text style={[T.sub, { textAlign: 'center' }]}>
            Name, role and what you're building are required.
          </Text>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function TagPicker({
  label,
  selected,
  color,
  onToggle,
}: {
  label: string;
  selected: Tag[];
  color: string;
  onToggle: (t: Tag) => void;
}) {
  return (
    <Card>
      <Text style={T.label}>{label}</Text>
      <Row>
        {(Object.keys(TAGS) as Tag[]).map(t => (
          <Chip
            key={t}
            label={TAGS[t]}
            selected={selected.includes(t)}
            color={color}
            onPress={() => onToggle(t)}
          />
        ))}
      </Row>
    </Card>
  );
}

function Field({
  label,
  multiline,
  ...props
}: { label: string; multiline?: boolean } & React.ComponentProps<
  typeof TextInput
>) {
  const [focused, setFocused] = useState(false);
  return (
    <Labeled label={label}>
      <TextInput
        accessibilityLabel={label}
        style={[
          s.input,
          multiline && s.multiline,
          focused && { borderColor: C.muted },
        ]}
        placeholderTextColor={C.faint}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </Labeled>
  );
}

function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={T.label}>{label}</Text>
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  welcome: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  brand: {
    fontFamily: F.bold,
    fontSize: 64,
    color: C.text,
    letterSpacing: -2.5,
    marginTop: 20,
  },
  tilt: {
    transform: [{ rotate: '-12deg' }, { scale: 1.05 }],
    marginHorizontal: -10,
  },
  start: {
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    flexDirection: 'row-reverse',
  },
  input: {
    backgroundColor: C.bg,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.lineStrong,
    color: C.text,
    fontFamily: F.regular,
    fontSize: 17,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  multiline: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: 13,
  },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.bg,
    borderRadius: R.input,
    borderWidth: 1,
    borderColor: C.lineStrong,
    paddingLeft: 14,
  },
  socialLabel: {
    fontFamily: F.medium,
    fontSize: 15,
    color: C.muted,
    width: 86,
  },
  socialInput: {
    flex: 1,
    color: C.text,
    fontFamily: F.regular,
    fontSize: 16,
    paddingVertical: 13,
    paddingRight: 14,
  },
});
