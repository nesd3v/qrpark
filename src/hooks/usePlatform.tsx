import { useEffect, useState } from "react";

export type Platform = "web" | "android" | "ios";

const detect = (): Platform => {
  if (typeof window === "undefined") return "web";
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.();
    if (p === "android") return "android";
    if (p === "ios") return "ios";
  }
  return "web";
};

export const usePlatform = () => {
  const [platform, setPlatform] = useState<Platform>(detect());

  useEffect(() => {
    setPlatform(detect());
  }, []);

  return {
    platform,
    isNative: platform !== "web",
    isAndroid: platform === "android",
    isIOS: platform === "ios",
    isWeb: platform === "web",
  };
};
