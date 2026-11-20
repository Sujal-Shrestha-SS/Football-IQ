import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.footballiq',
  appName: 'Football IQ',
  webDir: 'dist',
  android: {
    allowMixedContent: true
  }
};

export default config;
