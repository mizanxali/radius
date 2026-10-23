import { PermissionsAndroid, Platform } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, utf8ToBytes } from '@noble/hashes/utils.js';
import {
  MeshServices,
  type DiagnosticEvent,
  type IdentityReadyEvent,
  OfflineProtocol,
  type NeighborDiscoveredEvent,
  type ServiceDiscoveredEvent,
  type ServiceRequestReceivedEvent,
  type ServiceResponseReceivedEvent,
} from '@offline-protocol/mesh-sdk';

export const SERVICE_ID = 'radius.v1';
export const storage = createMMKV();

// The SDK's BLE bridges derive the advertised mesh node id from `profile`, so it
// must differ per install: a shared constant makes every phone the same node.
const meshProfile =
  storage.getString('meshProfile') ??
  (() => {
    const p =
      'r' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
    storage.set('meshProfile', p);
    return p;
  })();

/** The node hash this phone's BLE advertisements carry (first 8 bytes of SHA-256(profile)). */
export const myNodeHash = bytesToHex(
  sha256(utf8ToBytes(meshProfile)).slice(0, 8),
);

// Radius only exchanges public profile data. Encryption stays "enabled" solely so
// start() opens the identity key store (no off1 address otherwise); per-peer key
// exchange is off, and service frames are signed by the identity key anyway.
export const protocol = new OfflineProtocol({
  appId: 'radius',
  profile: meshProfile,
  transports: { ble: { enabled: true } },
  encryption: {
    enabled: true,
    autoKeyExchange: false,
    requireEncryption: false,
    encryptServiceMessages: false,
  },
});
export const services = new MeshServices();

async function requestAndroidPermissions() {
  if (Platform.OS !== 'android') return;
  const P = PermissionsAndroid.PERMISSIONS;
  const perms =
    Platform.Version >= 31
      ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_ADVERTISE, P.BLUETOOTH_CONNECT]
      : [P.ACCESS_FINE_LOCATION];
  await PermissionsAndroid.requestMultiple(perms);
}

let started: Promise<string> | null = null;

/** Starts the SDK once; resolves with this device's off1 address. */
export function startMesh(): Promise<string> {
  started ??= (async () => {
    await requestAndroidPermissions();
    const ready = new Promise<string>(res =>
      protocol.on<IdentityReadyEvent>('identity_ready', e => res(e.address)),
    );
    await protocol.start();
    return (await protocol.localAddress()) || ready;
  })();
  return started;
}

/** Physically nearby = seen over a local radio, not a relay. */
export const isLocalTransport = (t: string) =>
  ['ble', 'wifidirect'].includes(t.toLowerCase());

export type {
  NeighborDiscoveredEvent,
  ServiceDiscoveredEvent,
  ServiceRequestReceivedEvent,
  ServiceResponseReceivedEvent,
};

/**
 * Live RSSI from BLE advertisements, ~4 Hz per peer, named by address when the
 * link knows it and by advertised node hash otherwise. Comes from a local patch
 * to the SDK's BLE bridges (patches/@offline-protocol+mesh-sdk+*.patch).
 */
export function onPeerRssi(
  cb: (rssi: number, peerId?: string, nodeHash?: string) => void,
) {
  protocol.on<DiagnosticEvent>('diagnostic', e => {
    if (e.message !== 'peer_rssi') return;
    const c = e.context as
      | { peerId?: string; nodeHash?: string; rssi?: number }
      | undefined;
    if (typeof c?.rssi === 'number') cb(c.rssi, c.peerId, c.nodeHash);
  });
}
