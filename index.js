/**
 * @format
 */
// Polyfills for WalletConnect/AppKit and @solana/web3.js; must load before anything else.
import 'text-encoding';
import '@walletconnect/react-native-compat';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
