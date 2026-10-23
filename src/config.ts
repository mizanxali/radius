// RN's own dev-server lookup (reads NativeSourceCode.getConstants().scriptURL,
// which bridgeless builds no longer expose on NativeModules).
// @ts-expect-error untyped RN internal
import getDevServer from 'react-native/Libraries/Core/Devtools/getDevServer';

// Public client config. Secrets live in the Worker, never here.

// In dev, the Worker runs on the Metro host (`npm run dev` in worker/, port 8787):
// the iPhone reaches it over Wi-Fi, Android via `adb reverse tcp:8787 tcp:8787`.
const metroHost = __DEV__
  ? (getDevServer().url as string).match(/^https?:\/\/([^/:]+)/)?.[1]
  : undefined;
export const WORKER_URL =
  __DEV__ && metroHost
    ? `http://${metroHost}:8787`
    : 'https://radius.mizanalip786.workers.dev';

export const REOWN_PROJECT_ID = 'REPLACE_WITH_REOWN_PROJECT_ID'; // dashboard.reown.com (public id)
