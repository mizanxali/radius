import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import {
  CATEGORIES,
  SOCIALS,
  TAGS,
  useMyProfile,
  type Category,
  type Profile,
  type Social,
  type Tag,
} from '../profile';
import { publishCard, useMyAddress } from '../peers';
import { Avatar, Chip, GradientButton, Row, tap } from '../ui';
import { BODY, C, CAT_COLOR, H1, LABEL } from '../theme';

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
  const insets = useSafeAreaInsets();
  const [saved, save] = useMyProfile();
  const me = useMyAddress();
  const [p, setP] = useState<Omit<Profile, 'id'>>(saved ?? blank);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP(prev => ({ ...prev, [k]: v }));
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

  const ready = p.name.trim() && p.role.trim() && p.building.trim() && me;
  const submit = async () => {
    save({ ...p, id: me, name: p.name.trim(), role: p.role.trim() });
    await publishCard();
    onDone();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingTop: saved && Platform.OS === 'ios' ? 20 : insets.top + 16, paddingBottom: insets.bottom + 32, gap: 22 }}
        keyboardShouldPersistTaps="handled">
        <View>
          <Text style={H1}>{saved ? 'Edit profile' : 'Who are you?'}</Text>
          <Text style={[BODY, { color: C.muted, marginTop: 6 }]}>
            Everyone around you sees this card. Make it count.
          </Text>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Pick profile photo" onPress={pickPhoto} style={{ alignSelf: 'center' }}>
          <Avatar name={p.name || '+'} avatar={p.avatar} size={120} />
          <Text style={[LABEL, { textAlign: 'center', marginTop: 8 }]}>{p.avatar ? 'Change photo' : 'Add photo'}</Text>
        </Pressable>

        <Field label="Name" value={p.name} onChangeText={v => set('name', v)} placeholder="Vitalik" />
        <Field label="Role" value={p.role} onChangeText={v => set('role', v)} placeholder="Founder & CEO" />
        <Field label="Company / project" value={p.company ?? ''} onChangeText={v => set('company', v)} placeholder="Optional" />

        <Section label="I'm a">
          <Row>
            {(Object.keys(CATEGORIES) as Category[]).map(c => (
              <Chip
                key={c}
                label={`${CATEGORIES[c].emoji} ${CATEGORIES[c].label}`}
                selected={p.category === c}
                color={CAT_COLOR[c]}
                onPress={() => set('category', c)}
              />
            ))}
          </Row>
        </Section>

        <Field
          label="What I'm building"
          value={p.building}
          onChangeText={v => set('building', v)}
          placeholder="A gasless wallet for the next billion users"
          multiline
        />
        <Field label="Bio" value={p.bio} onChangeText={v => set('bio', v)} placeholder="ex-Coinbase, 3x hackathon winner, dog dad" multiline />

        <Section label="Looking for">
          <Row>
            {(Object.keys(TAGS) as Tag[]).map(t => (
              <Chip key={t} label={TAGS[t]} selected={p.lookingFor.includes(t)} color={C.hot} onPress={() => toggle('lookingFor', t)} />
            ))}
          </Row>
        </Section>
        <Section label="I can offer">
          <Row>
            {(Object.keys(TAGS) as Tag[]).map(t => (
              <Chip key={t} label={TAGS[t]} selected={p.offering.includes(t)} color={C.money} onPress={() => toggle('offering', t)} />
            ))}
          </Row>
        </Section>

        <Section label="Socials">
          {(Object.keys(SOCIALS) as Social[]).map(k => (
            <View key={k} style={s.social}>
              <Text style={s.socialLabel}>{SOCIALS[k].label}</Text>
              <TextInput
                accessibilityLabel={`${SOCIALS[k].label} handle`}
                style={s.socialInput}
                value={p.socials[k] ?? ''}
                onChangeText={v => set('socials', { ...p.socials, [k]: v.replace(/^@/, '').trim() || undefined })}
                placeholder="handle"
                placeholderTextColor={C.line}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          ))}
        </Section>

        <GradientButton title={saved ? 'Save' : "Let's go →"} disabled={!ready} onPress={submit} />
        {saved && (
          <Pressable accessibilityRole="button" onPress={() => (tap(), onDone())}>
            <Text style={[LABEL, { textAlign: 'center' }]}>Cancel</Text>
          </Pressable>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={LABEL}>{label}</Text>
      {children}
    </View>
  );
}

function Field({
  label,
  multiline,
  ...props
}: { label: string; multiline?: boolean } & React.ComponentProps<typeof TextInput>) {
  return (
    <Section label={label}>
      <TextInput
        accessibilityLabel={label}
        style={[s.input, multiline && { minHeight: 84, textAlignVertical: 'top' }]}
        placeholderTextColor={C.line}
        multiline={multiline}
        {...props}
      />
    </Section>
  );
}

const s = StyleSheet.create({
  input: {
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    color: C.text,
    fontSize: 17,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.line,
    paddingLeft: 16,
  },
  socialLabel: { color: C.muted, fontWeight: '800', width: 90 },
  socialInput: { flex: 1, color: C.text, fontSize: 16, paddingVertical: 14, paddingRight: 16 },
});
