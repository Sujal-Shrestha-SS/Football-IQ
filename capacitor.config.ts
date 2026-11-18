import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourname.footballiq',
  appName: 'Football IQ',
  webDir: 'dist',
  server: {
  url: 'https://football-iq.onrender.com',
  cleartext: false
}
};
export default config;