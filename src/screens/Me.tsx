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
import Haptics from 'react-native-haptic-feedback';
import { Check, Clock, PenLine, Trash2, Wallet } from 'lucide-react-native';
import { cachedProfile, publishCard, useMyProfile } from '../peers';
import { proveWallet, refreshNetWorth, removeWallet } from '../wallet';
import { shortAddress } from '../verify';
import { NetWorth } from '../NetWorth';
import { useStamps } from '../meet';
import { isDemo, setDemo } from '../demo';
import { Action, Avatar, Button, Card, ListRow, Tag, tap } from '../ui';
import { C, F, T } from '../theme';
import { ProfileView } from './Person';

export default function Me({ onEdit }: { onEdit: () => void }) {
  const [me, setMe] = useMyProfile();
  const { open, disconnect } = useAppKit();
  const { isConnected, allAccounts } = useAccount();
  const [busy, setBusy] = useState<'wallet' | 'price'>();
  const [error, setError] = useState<string>();
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

  return (
    <ProfileView
      id={me.id}
      title="My pass"
      right={
        // Hidden: long-press the empty top-right corner to fill the room with demo attendees.
        <Pressable
          accessibilityLabel="Demo mode"
          delayLongPress={800}
          onLongPress={() => {
            Haptics.trigger('notificationSuccess');
            setDemo(!isDemo());
          }}
          style={{ width: 48, height: 48 }}
        />
      }
      profile={me}
      status="you"
      actions={
        <View style={s.actions}>
          <Action icon={PenLine} label="Edit" color={C.blue} onPress={onEdit} />
          <Action
            icon={Wallet}
            label="Wallet"
            color={C.green}
            disabled={!!busy}
            onPress={() => open({ view: 'Connect' })}
          />
        </View>
      }
    >
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
        <Text style={[T.sub, { color: C.red, textAlign: 'center' }]}>
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
            <Text style={[T.label, { marginBottom: 6 }]}>Wallets</Text>
            {me.wallets.map(w => (
              <ListRow
                key={w.address}
                leading={
                  <View style={s.chain}>
                    <Text
                      style={[
                        s.chainText,
                        { color: w.chain === 'evm' ? C.blue : C.purple },
                      ]}
                    >
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
                trackColor={{ true: C.green, false: C.lineStrong }}
                thumbColor={C.text}
              />
            </View>
          </Card>
        </>
      ) : (
        !pending && (
          <Card>
            <View style={s.flex}>
              <View style={s.chain}>
                <Wallet size={18} color={C.green} strokeWidth={2} />
              </View>
              <Text style={T.h2}>Flex your bags</Text>
            </View>
            <Text style={[T.body, { color: C.muted }]}>
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
      <Text style={[T.label, { marginBottom: 6 }]}>People you've met</Text>
      {stamps.map(st => (
        <ListRow
          key={st.id}
          leading={
            <Avatar
              name={st.peer.name}
              avatar={cachedProfile(st.peer.id)?.avatar}
              size={40}
              category={cachedProfile(st.peer.id)?.category}
            />
          }
          title={st.peer.name}
          subtitle={`${new Date(st.payload.ts).toLocaleDateString()}${
            st.peer.company ? ` · ${st.peer.company}` : ''
          }`}
          trailing={
            <Tag
              label={st.status === 'minted' ? 'On Base ↗\uFE0E' : 'Minting'}
              icon={st.status === 'minted' ? Check : Clock}
              color={st.status === 'minted' ? C.green : C.amber}
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
  flex: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  chain: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.raised,
    borderWidth: 1,
    borderColor: C.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chainText: { fontFamily: F.bold, fontSize: 17 },
  toggle: { flexDirection: 'row', alignItems: 'center', paddingTop: 10 },
});
