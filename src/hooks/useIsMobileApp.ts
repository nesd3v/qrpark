import { useMemo } from "react";

/**
 * Detects if the app is running inside a Capacitor native shell (iOS/Android).
 * Returns true when opened from Play Store / App Store app,
 * false when opened in a regular browser.
 */
export const useIsMobileApp = (): boolean => {
  return useMemo(() => {
    // Capacitor injects a global object when running inside native shell
    return !!(window as any).Capacitor?.isNativePlatform?.() 
      || !!(window as any).Capacitor?.isPluginAvailable;
  }, []);
};

/**
 * Non-hook version for use outside React components
 */
export const isMobileApp = (): boolean => {
  return !!(window as any).Capacitor?.isNativePlatform?.()
    || !!(window as any).Capacitor?.isPluginAvailable;
};
