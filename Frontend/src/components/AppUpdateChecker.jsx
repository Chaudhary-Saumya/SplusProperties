import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { AppUpdate, AppUpdateAvailability } from '@capawesome/capacitor-app-update';

/**
 * AppUpdateChecker Component
 * Automatically checks Google Play Store for new app updates on Android startup.
 * Prompts the user with Google Play's native in-app update UI if an update is available.
 */
export default function AppUpdateChecker() {
  useEffect(() => {
    const checkUpdate = async () => {
      // Execute only on native Android devices
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
        return;
      }

      try {
        const result = await AppUpdate.getAppUpdateInfo();

        // Check if an update is available on Google Play
        if (result.updateAvailability === AppUpdateAvailability.UPDATE_AVAILABLE) {
          if (result.immediateUpdateAllowed) {
            // Full-screen mandatory update prompt
            await AppUpdate.performImmediateUpdate();
          } else if (result.flexibleUpdateAllowed) {
            // Background update download prompt
            await AppUpdate.startFlexibleUpdate();
          }
        }
      } catch (error) {
        // Logs warning if tested on local debug build not linked to Play Store
        console.warn('[AppUpdate] Check for update skipped or unavailable:', error?.message || error);
      }
    };

    checkUpdate();
  }, []);

  return null;
}
