import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d20802c2fb2446bbb84dbab006739167',
  appName: 'QRPark',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  server: {
    url: 'https://d20802c2-fb24-46bb-b84d-bab006739167.lovableproject.com?forceHideBadge=true',
    cleartext: true,
    androidScheme: 'https',
    allowNavigation: [
      '*.lovableproject.com',
      '*.lovable.app',
      '*.supabase.co',
      '*.supabase.in',
    ],
  },
};

export default config;
