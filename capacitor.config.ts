import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.be47a1069e0043dba4cb620ec316de2a',
  appName: 'CHIMERA-PIP 3000 mk 1',
  webDir: 'dist',
  server: {
    url: 'https://be47a106-9e00-43db-a4cb-620ec316de2a.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: '#0a0f0a'
    }
  }
};

export default config;