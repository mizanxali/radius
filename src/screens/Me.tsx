import { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { useMyProfile } from '../peers';
import { publishCard } from '../peers';
import { proveWallet, refreshNetWorth, removeWallet } from '../wallet';
import { shortAddress } from '../verify';
import { NetWorth } from '../NetWorth';
import { roastMe } from '../ai';
import { useStamps } from '../meet';
import { cachedProfile } from '../peers';
import { Avatar } from '../ui';
import { GradientButton, tap } from '../ui';
import { BODY, C, G, LABEL } from '../theme';
import { ProfileView } from './Person';

export default function Me({ onEdit }: { onEdit: () => void }) {
  const [me] = useMyProfile();
  return (
    <ProfileView
      profile={me}
      status="you"
      actions={
        <View style={{ gap: 14 }}>
          <GradientButton
            title="Edit profile"
            colors={G.cool}
            onPress={onEdit}
          />
          <Wallets />
          <Stamps />
          <Roast />
        </View>
      }
    />
  );
}

function Wallets() {
  const [me, setMe] = useMyProfile();
  const { open, disconnect } = useAppKit();
  const { isConnected, allAccounts } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  if (!me) return null;

  const has = (a: string) =>
    me.wallets.some(w => w.address.toLowerCase() === a.toLowerCase());
  const pending = isConnected
    ? allAccounts.find(a => !has(a.address))
    : undefined;

  const run = (f: () => Promise<unknown>) => async () => {
    setBusy(true);
    setError(undefined);
    try {
      await f();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ gap: 12 }}>
      {me.wallets.length > 0 && (
        <NetWorth
          usd={me.netWorthUsd}
          verifiedCount={me.wallets.length}
          onRefresh={busy ? undefined : run(refreshNetWorth)}
        />
      )}

      {me.wallets.map(w => (
        <View key={w.address} style={s.wallet}>
          <Text style={s.chain}>{w.chain === 'evm' ? 'Ξ' : '◎'}</Text>
          <Text style={s.addr}>{shortAddress(w.address)}</Text>
          <Text style={s.ok}>✓ verified</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${shortAddress(w.address)}`}
            hitSlop={10}
            onPress={() => (tap(), run(() => removeWallet(w.address))())}
          >
            <Text style={{ color: C.muted, fontWeight: '900' }}>✕</Text>
          </Pressable>
        </View>
      ))}

      {pending ? (
        <GradientButton
          title={
            busy
              ? 'Check your wallet…'
              : `✍️ Sign to verify ${shortAddress(pending.address)}`
          }
          colors={G.money}
          disabled={busy}
          onPress={run(async () => {
            await proveWallet(
              `${pending.namespace}:${pending.chainId}:${pending.address}`,
            );
            await disconnect(); // the proof is all we keep; no live session needed
          })}
        />
      ) : (
        <GradientButton
          title={
            me.wallets.length
              ? '+ Add another wallet'
              : '💰 Connect wallet · flex your bags'
          }
          colors={G.money}
          disabled={busy}
          onPress={() => open({ view: 'Connect' })}
        />
      )}
      {error && <Text style={[BODY, { color: C.hot }]}>{error}</Text>}

      {me.wallets.length > 0 && (
        <View style={s.toggle}>
          <Text style={[LABEL, { flex: 1 }]}>Show exact amount to others</Text>
          <Switch
            accessibilityLabel="Show exact net worth to others"
            value={!me.hideExactNetWorth}
            onValueChange={v => {
              setMe({ ...me, hideExactNetWorth: !v });
              publishCard();
            }}
            trackColor={{ true: C.money, false: C.line }}
          />
        </View>
      )}
    </View>
  );
}

function Stamps() {
  const stamps = useStamps();
  if (!stamps.length) return null;
  return (
    <View style={{ gap: 10 }}>
      <Text style={LABEL}>🤝 People you've met · {stamps.length}</Text>
      {stamps.map(st => (
        <Pressable
          key={st.id}
          accessibilityRole={st.url ? 'link' : undefined}
          disabled={!st.url}
          onPress={() => st.url && (tap(), Linking.openURL(st.url))}
          style={s.wallet}
        >
          <Avatar
            name={st.peer.name}
            avatar={cachedProfile(st.peer.id)?.avatar}
            size={40}
            colors={G.money}
          />
          <View style={{ flex: 1 }}>
            <Text style={s.addr} numberOfLines={1}>
              {st.peer.name}
            </Text>
            <Text style={{ color: C.muted, fontSize: 12 }}>
              {new Date(st.payload.ts).toLocaleDateString()}
              {st.peer.company ? ` · ${st.peer.company}` : ''}
            </Text>
          </View>
          <Text style={[s.ok, st.status !== 'minted' && { color: C.muted }]}>
            {st.status === 'minted' ? '⛓ On Base ↗' : 'minting…'}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Roast() {
  const [roast, setRoast] = useState<string>();
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      setRoast(await roastMe());
    } catch {
      setRoast('The roast machine is offline. Lucky you.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <View style={{ gap: 12 }}>
      <GradientButton
        title={
          busy
            ? 'Cooking…'
            : roast
            ? '🔥 Roast me again'
            : '🔥 Roast my profile'
        }
        colors={G.hot}
        disabled={busy}
        onPress={go}
      />
      {roast && (
        <View style={s.roast}>
          <Text style={LABEL}>The room says</Text>
          <Text
            style={[BODY, { fontSize: 18, fontWeight: '700', lineHeight: 26 }]}
          >
            {roast}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  roast: {
    backgroundColor: '#FF2E9318',
    borderColor: C.hot,
    borderWidth: 1.5,
    borderRadius: 22,
    padding: 18,
    gap: 8,
  },
  wallet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.line,
  },
  chain: {
    color: C.text,
    fontSize: 18,
    fontWeight: '900',
    width: 20,
    textAlign: 'center',
  },
  addr: {
    color: C.text,
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  ok: { color: C.money, fontSize: 12, fontWeight: '800' },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
});
