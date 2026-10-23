import { TurboModuleRegistry } from 'react-native';

// Public client config. Secrets live in the Worker, never here.

// In dev, the Worker runs on the Metro host (`npm run dev` in worker/, port 8787):
// the iPhone reaches it over Wi-Fi, Android via `adb reverse tcp:8787 tcp:8787`.
// The bundle URL Metro served us from (bridgeless builds no longer expose it on NativeModules).
const scriptURL: string | undefined = __DEV__
  ? TurboModuleRegistry.get<any>('SourceCode')?.getConstants?.().scriptURL
  : undefined;
const metroHost = scriptURL?.match(/^https?:\/\/([^/:]+)/)?.[1];
export const WORKER_URL =
  __DEV__ && metroHost
    ? `http://${metroHost}:8787`
    : 'https://radius.mizanalip786.workers.dev';

export const REOWN_PROJECT_ID = '6a225bc58a079102da4e76dd5693b91a'; // dashboard.reown.com (public id)
