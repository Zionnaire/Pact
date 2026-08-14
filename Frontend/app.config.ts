import { ExpoConfig } from '@expo/config-types';

/**
 * app.config.ts
 * Was app.json (static). Converted so EXPO_PUBLIC_API_URL can be surfaced
 * into `extra.apiUrl`, readable at runtime via Constants.expoConfig?.extra
 * — see src/config/env.ts. That's the point: with a plain process.env.
 * EXPO_PUBLIC_* inline (the old approach), there was no way to check what
 * URL actually got baked into a given build/update short of pulling device
 * logs. With `extra`, the running app can just report it — see the "API
 * endpoint" row in Pact tab → Settings.
 *
 * Whatever's in EXPO_PUBLIC_API_URL when this file is evaluated is what
 * ships — and per https://docs.expo.dev/eas/environment-variables/faq/,
 * `eas update` reads that from the local .env file, NOT from eas.json's
 * build-profile `env` block (that only applies to `eas build`). Keep
 * Frontend/.env pointed at the real backend before publishing an update.
 */
function defaultApiUrl(): string {
  return 'http://10.0.2.2:5001/api/v1';
}

const config: ExpoConfig = {
  name: 'Pact',
  slug: 'pact',
  scheme: 'pact',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'app.pact.mobile',
  },
  android: {
    package: 'app.pact.mobile',
    adaptiveIcon: {
      backgroundColor: '#F9F7F2',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-secure-store',
    [
      'expo-audio',
      {
        microphonePermission: 'Pact needs microphone access so you can record voice entries for your partner.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'Pact needs photo library access so you can choose a profile picture.',
        cameraPermission: false,
        microphonePermission: false,
      },
    ],
    'expo-font',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#F9F7F2',
        image: './assets/splash-icon.png',
        imageWidth: 140,
      },
    ],
    [
      'expo-build-properties',
      {
        android: {
          enableMinifyInReleaseBuilds: false,
          enableProguardInReleaseBuilds: false,
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: 'faeebc9d-1c13-49b8-95cf-34ce8b6a755c',
    },
    apiUrl: process.env.EXPO_PUBLIC_API_URL || defaultApiUrl(),
  },
  owner: 'zionnaire',
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    url: 'https://u.expo.dev/faeebc9d-1c13-49b8-95cf-34ce8b6a755c',
  },
};

export default config;
