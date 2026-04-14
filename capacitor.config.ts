import type { CapacitorConfig } from '@capacitor/cli';

const liveReloadUrl = process.env.CAP_SERVER_URL?.trim();

const server = liveReloadUrl
  ? {
      url: liveReloadUrl,
      cleartext: liveReloadUrl.startsWith('http://'),
      androidScheme: liveReloadUrl.startsWith('http://') ? 'http' : 'https',
      allowNavigation: [
        '*.lovableproject.com',
        '*.lovable.app',
        '*.supabase.co',
        '*.supabase.in',
      ],
    }
  : undefined;

const config: CapacitorConfig = {
  appId: 'app.lovable.d20802c2fb2446bbb84dbab006739167',
  appName: 'QRPark',
  webDir: 'dist',
  android: {
    allowMixedContent: true,
  },
  ...(server ? { server } : {}),
};

export default config;
