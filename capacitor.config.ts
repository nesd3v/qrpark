import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.d20802c2fb2446bbb84dbab006739167",
  appName: "QRPark",
  webDir: "dist",
  // Production / native build: serve the bundled web assets from `dist/`.
  // The previous `server.url` pointed Capacitor at the Lovable preview which
  // could load an OUTDATED cached version (e.g. an old "Sticker Sipariş Et"
  // screen). Removing it ensures the APK always shows the current code.
  //
  // For live-reload during development you can temporarily uncomment:
  // server: {
  //   url: "https://d20802c2-fb24-46bb-b84d-bab006739167.lovableproject.com?forceHideBadge=true",
  //   cleartext: true,
  // },
  plugins: {
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0f0d",
    },
  },
};

export default config;
