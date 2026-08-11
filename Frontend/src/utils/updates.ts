/**
 * utils/updates.ts
 * OTA updates via EAS Update. `expo-updates` already checks and downloads
 * automatically on launch (checkAutomatically: "ON_LOAD" is the default —
 * see app.json `updates` block wired by `eas update:configure`), applying
 * on the *next* relaunch. This adds an explicit manual check so a user can
 * pull a pending update immediately instead of waiting for their next
 * cold start. No-ops in Expo Go / dev builds, where expo-updates is inert.
 */

import * as Updates from 'expo-updates';

export interface UpdateCheckResult {
  applied: boolean;
  message: string;
}

export async function checkAndApplyUpdate(): Promise<UpdateCheckResult> {
  if (!Updates.isEnabled) {
    return { applied: false, message: 'Updates are not available in this build.' };
  }

  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) {
      return { applied: false, message: 'You already have the latest version.' };
    }

    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return { applied: true, message: 'Update applied.' };
  } catch (err) {
    return { applied: false, message: err instanceof Error ? err.message : 'Could not check for updates.' };
  }
}
