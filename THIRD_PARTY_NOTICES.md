# Third-party notices

The code in this repository is licensed under MIT-0 (see [LICENSE](./LICENSE)),
except for the material listed below, which keeps its own license. Dependencies
installed from npm, CocoaPods or Maven keep their own licenses and are not
covered by this repository's LICENSE.

## Offline Protocol SDK

`vendor/offline-protocol-mesh-sdk-0.30.0-rssi.tgz` is a build of
`@offline-protocol/mesh-sdk`. It is dual-licensed: AGPL-3.0-only, or a
commercial license from Offline Protocol, Inc. See the package's `LICENSE` and
`LICENSE-COMMERCIAL.md`, and https://www.offlineprotocol.com/docs/operations/licensing.

## Fonts

`assets/fonts/`, `android/app/src/main/assets/fonts/` and `video/public/fonts/`
contain Cabinet Grotesk by Indian Type Foundry, licensed under the ITF Free Font
License. The license text is in `assets/fonts/CabinetGrotesk-LICENSE.txt`.

## DiceBear

`patches/@dicebear+core+10.7.0.patch` modifies
[DiceBear](https://github.com/dicebear/dicebear), licensed under the MIT
License (Copyright (c) 2026 Florian Körner).

## React Native project files

The native iOS and Android project files (`ios`, `android`) are generated from
the React Native app template (MIT License, Copyright (c) Meta Platforms, Inc.
and affiliates). The Gradle wrapper scripts and `gradle-wrapper.jar` are part
of Gradle and are licensed under the Apache License 2.0. `debug.keystore` is
the standard, publicly known React Native debug signing key: use it for local
testing only, never for a release build.
