// M0 probe: proves discovery, RSSI refresh rate and service payload limits on
// two real devices. Replaced by the real app in M1.
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  isLocalTransport,
  myNodeHash,
  onPeerRssi,
  protocol,
  SERVICE_ID,
  services,
  startMesh,
  type NeighborDiscoveredEvent,
  type ServiceDiscoveredEvent,
  type ServiceRequestReceivedEvent,
  type ServiceResponseReceivedEvent,
} from './src/mesh';

type Peer = {
  id: string;
  transport: string;
  evRssi?: number;
  evCount: number;
  topoRssi?: number;
  topoChanges: number;
  card?: Record<string, string>;
  hops?: number;
};

const log = (...a: unknown[]) => console.log('[probe]', ...a);

function Probe() {
  const [me, setMe] = useState('starting…');
  const [peers, setPeers] = useState<Record<string, Peer>>({});
  const [lines, setLines] = useState<string[]>([]);
  const sentAt = useRef<Record<string, number>>({});
  const byHash = useRef<Record<string, string>>({});

  const say = (s: string) => {
    log(s);
    setLines(l => [s, ...l].slice(0, 30));
  };
  const patch = (id: string, f: (p: Peer) => Partial<Peer>) =>
    setPeers(ps => {
      const p = ps[id] ?? { id, transport: '?', evCount: 0, topoChanges: 0 };
      return { ...ps, [id]: { ...p, ...f(p) } };
    });

  useEffect(() => {
    protocol.on<NeighborDiscoveredEvent>('neighbor_discovered', e => {
      log('neighbor', e.peer_id.slice(0, 12), e.transport, e.rssi);
      if (!isLocalTransport(e.transport)) return;
      patch(e.peer_id, p => ({ transport: e.transport, evRssi: e.rssi, evCount: p.evCount + 1 }));
      services.discoverServices(SERVICE_ID).catch(err => say(`discover err ${err}`));
    });
    protocol.on<ServiceDiscoveredEvent>('service_discovered', e => {
      const len = JSON.stringify(e.capabilities).length;
      say(`card from ${e.provider_peer_id.slice(0, 10)} hops=${e.hop_count} capLen=${len}`);
      if (e.capabilities.nh) byHash.current[e.capabilities.nh] = e.provider_peer_id;
      patch(e.provider_peer_id, () => ({ card: e.capabilities, hops: e.hop_count }));
    });
    protocol.on<ServiceRequestReceivedEvent>('service_request_received', e => {
      const n = Number(e.body) || 0;
      say(`req ${e.method} ${n}B from ${e.sender.slice(0, 10)}`);
      services
        .respondToServiceRequest(e.request_id, e.sender, e.service_id, 'ok', 'x'.repeat(n))
        .catch(err => say(`respond err ${err}`));
    });
    protocol.on<ServiceResponseReceivedEvent>('service_response_received', e => {
      const ms = Date.now() - (sentAt.current[e.request_id] ?? Date.now());
      say(`resp ${e.status} ${e.body.length}B in ${ms}ms`);
    });

    onPeerRssi((rssi, peerId, nodeHash) => {
      const id = peerId ?? (nodeHash && byHash.current[nodeHash]);
      if (id) patch(id, p => ({ topoRssi: rssi, topoChanges: p.topoChanges + 1 }));
    });

    startMesh()
      .then(async addr => {
        setMe(addr);
        // ~1 KB card to test the capabilities size budget.
        await services.registerService(SERVICE_ID, '1', {
          n: 'Probe ' + addr.slice(-4),
          nh: myNodeHash,
          bio: 'b'.repeat(900),
        });
        await services.discoverServices(SERVICE_ID);
      })
      .catch(err => setMe(`start failed: ${err}`));

    const rediscover = setInterval(() => services.discoverServices(SERVICE_ID).catch(() => {}), 15000);
    return () => {
      clearInterval(rediscover);
    };
  }, []);

  const probe = async (peer: string, bytes: number) => {
    try {
      const id = await services.sendServiceRequest(peer, SERVICE_ID, 'probe', String(bytes));
      sentAt.current[id] = Date.now();
      say(`sent probe ${bytes}B`);
    } catch (err) {
      say(`probe ${bytes} err ${err}`);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      <Text style={s.h}>Radius probe</Text>
      <Text style={s.small} selectable>{me}</Text>
      <ScrollView>
        {Object.values(peers).map(p => (
          <View key={p.id} style={s.card}>
            <Text style={s.t}>{p.card?.n ?? p.id.slice(0, 16)} · {p.transport} · hops {p.hops ?? '?'}</Text>
            <Text style={s.small}>
              event rssi {p.evRssi ?? '-'} (x{p.evCount}) · live rssi {p.topoRssi ?? '-'} (x{p.topoChanges})
            </Text>
            <View style={s.row}>
              {[4, 16, 64, 128].map(kb => (
                <Pressable key={kb} style={s.btn} onPress={() => probe(p.id, kb * 1024)}>
                  <Text style={s.t}>{kb}KB</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
        {lines.map((l, i) => (
          <Text key={i} style={s.small}>{l}</Text>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Probe />
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b0b14', padding: 16 },
  h: { color: '#fff', fontSize: 28, fontWeight: '800' },
  t: { color: '#fff', fontSize: 15 },
  small: { color: '#9aa', fontSize: 12, marginVertical: 2 },
  card: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 12, marginVertical: 6 },
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  btn: { backgroundColor: '#6d28d9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
});
