import { useEffect } from "react";
import { usePlatform } from "./usePlatform";

// Lazy load native plugins only on native platforms to avoid web bundle bloat
const getHaptics = async () => {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    return { Haptics, ImpactStyle };
  } catch {
    return null;
  }
};

const getStatusBar = async () => {
  if (typeof window === "undefined") return null;
  const cap = (window as any).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    return { StatusBar, Style };
  } catch {
    return null;
  }
};

export const haptic = {
  light: async () => {
    const h = await getHaptics();
    if (h) h.Haptics.impact({ style: h.ImpactStyle.Light }).catch(() => {});
  },
  medium: async () => {
    const h = await getHaptics();
    if (h) h.Haptics.impact({ style: h.ImpactStyle.Medium }).catch(() => {});
  },
  heavy: async () => {
    const h = await getHaptics();
    if (h) h.Haptics.impact({ style: h.ImpactStyle.Heavy }).catch(() => {});
  },
  success: async () => {
    const h = await getHaptics();
    if (h) {
      try {
        const { NotificationType } = await import("@capacitor/haptics");
        h.Haptics.notification({ type: NotificationType.Success });
      } catch {}
    }
  },
  error: async () => {
    const h = await getHaptics();
    if (h) {
      try {
        const { NotificationType } = await import("@capacitor/haptics");
        h.Haptics.notification({ type: NotificationType.Error });
      } catch {}
    }
  },
};

// Initialize StatusBar appearance to match dark theme
export const useNativeInit = () => {
  const { isNative } = usePlatform();

  useEffect(() => {
    if (!isNative) return;
    (async () => {
      const sb = await getStatusBar();
      if (!sb) return;
      try {
        await sb.StatusBar.setStyle({ style: sb.Style.Dark });
        await sb.StatusBar.setBackgroundColor({ color: "#0a0f0d" });
        await sb.StatusBar.setOverlaysWebView({ overlay: false });
      } catch (e) {
        console.warn("StatusBar init failed", e);
      }
    })();
  }, [isNative]);
};
