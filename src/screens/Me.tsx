import { useState } from 'react';
import {
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAccount, useAppKit } from '@reown/appkit-react-native';
import { Flame, PenLine, Trash2, Wallet } from 'lucide-react-native';
import { cachedProfile, publishCard, useMyProfile } from '../peers';
import { proveWallet, refreshNetWorth, removeWallet } from '../wallet';
import { shortAddress } from '../verify';
import { NetWorth } from '../NetWorth';
import { roastMe } from '../ai';
import { useStamps } from '../meet';
import { Action, Avatar, Button, Card, ListRow, Tag, tap } from '../ui';
import { C, F, T } from '../theme';
import { ProfileView } from './Person';

export default function Me({ onEdit }: { onEdit: () => void }) {
  const [me, setMe] = useMyProfile();
  const { open, disconnect } = useAppKit();
  const { isConnected, allAccounts } = useAccount();
  const [busy, setBusy] = useState<'wallet' | 'roast' | 'price'>();
  const [error, setError] = useState<string>();
  const [roast, setRoast] = useState<string>();
  if (!me) return null;

  const has = (a: string) =>
    me.wallets.some(w => w.address.toLowerCase() === a.toLowerCase());
  const pending = isConnected
    ? allAccounts.find(a => !has(a.address))
    : undefined;

  const run = (kind: typeof busy, f: () => Promise<unknown>) => async () => {
    setBusy(kind);
    setError(undefined);
    try {
      await f();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(undefined);
    }
  };

  const doRoast = run('roast', async () => {
    try {
      setRoast(await roastMe());
    } catch {
      setRoast('The roast machine is offline. Lucky you.');
    }
  });

  return (
    <ProfileView
      id={me.id}
      title="My pass"
      profile={me}
      status="you"
      actions={
        <View style={s.actions}>
          <Action icon={PenLine} label="Edit" onPress={onEdit} />
          <Action
            icon={Wallet}
            label="Wallet"
            disabled={!!busy}
            onPress={() => open({ view: 'Connect' })}
          />
          <Action
            icon={Flame}
            label={busy === 'roast' ? 'Cooking…' : 'Roast me'}
            active
            disabled={!!busy}
            onPress={doRoast}
          />
        </View>
      }
    >
      {roast && (
        <Animated.View entering={FadeInDown}>
          <Card tint={C.lilac}>
            <Text style={[T.label, { color: '#1E1E22AA' }]}>The room says</Text>
            <Text style={s.roast}>{roast}</Text>
          </Card>
        </Animated.View>
      )}

      {pending && (
        <Button
          title={
            busy === 'wallet'
              ? 'Check your wallet…'
              : `Sign to verify ${shortAddress(pending.address)}`
          }
          disabled={!!busy}
          onPress={run('wallet', async () => {
            await proveWallet(
              `${pending.namespace}:${pending.chainId}:${pending.address}`,
            );
            await disconnect(); // the proof is all we keep; no live session needed
          })}
        />
      )}
      {error && (
        <Text style={[T.sub, { color: C.rose, textAlign: 'center' }]}>
          {error}
        </Text>
      )}

      {me.wallets.length > 0 ? (
        <>
          <NetWorth
            usd={me.netWorthUsd}
            verifiedCount={me.wallets.length}
            onRefresh={busy ? undefined : run('price', refreshNetWorth)}
          />
          <Card style={{ gap: 4 }}>
            <Text style={[T.h2, { marginBottom: 6 }]}>Wallets</Text>
            {me.wallets.map(w => (
              <ListRow
                key={w.address}
                leading={
                  <View
                    style={[
                      s.chain,
                      { backgroundColor: w.chain === 'evm' ? C.blue : C.lilac },
                    ]}
                  >
                    <Text style={s.chainText}>
                      {w.chain === 'evm' ? 'Ξ' : '◎'}
                    </Text>
                  </View>
                }
                title={shortAddress(w.address)}
                subtitle={
                  w.chain === 'evm'
                    ? 'Ethereum · verified'
                    : 'Solana · verified'
                }
                trailing={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${shortAddress(w.address)}`}
                    hitSlop={10}
                    onPress={() => (
                      tap(), run('wallet', () => removeWallet(w.address))()
                    )}
                  >
                    <Trash2 size={20} color={C.muted} strokeWidth={1.6} />
                  </Pressable>
                }
              />
            ))}
            <View style={s.toggle}>
              <Text style={[T.body, { flex: 1 }]}>Show exact amount</Text>
              <Switch
                accessibilityLabel="Show exact net worth to others"
                value={!me.hideExactNetWorth}
                onValueChange={v => {
                  setMe({ ...me, hideExactNetWorth: !v });
                  publishCard();
                }}
                trackColor={{ true: C.blue, false: C.raised }}
                thumbColor={C.text}
              />
            </View>
          </Card>
        </>
      ) : (
        !pending && (
          <Card tint={C.blue}>
            <Text style={[T.h2, { color: C.ink }]}>Flex your bags</Text>
            <Text style={[T.body, { color: '#1E1E22CC' }]}>
              Connect and sign with an Ethereum or Solana wallet. Your net worth
              shows on your pass, verified.
            </Text>
            <Button
              title="Connect wallet"
              icon={Wallet}
              onPress={() => open({ view: 'Connect' })}
            />
          </Card>
        )
      )}

      <Stamps />
    </ProfileView>
  );
}

function Stamps() {
  const stamps = useStamps();
  if (!stamps.length) return null;
  return (
    <Card style={{ gap: 4 }}>
      <Text style={[T.h2, { marginBottom: 6 }]}>People you've met</Text>
      {stamps.map(st => (
        <ListRow
          key={st.id}
          leading={
            <Avatar
              name={st.peer.name}
              avatar={cachedProfile(st.peer.id)?.avatar}
              size={44}
              color={C.mint}
            />
          }
          title={st.peer.name}
          subtitle={`${new Date(st.payload.ts).toLocaleDateString()}${
            st.peer.company ? ` · ${st.peer.company}` : ''
          }`}
          trailing={
            <Tag
              label={st.status === 'minted' ? 'On Base ↗' : 'Minting'}
              color={st.status === 'minted' ? C.mint : C.raised}
            />
          }
          onPress={st.url ? () => Linking.openURL(st.url!) : undefined}
        />
      ))}
    </Card>
  );
}

const s = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 4,
  },
  roast: { fontFamily: F.medium, fontSize: 19, lineHeight: 26, color: C.ink },
  chain: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainText: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
});
