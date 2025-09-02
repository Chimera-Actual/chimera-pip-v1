import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // UI components and styling
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-select',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-toast'
          ],
          
          // Data fetching and state management
          'data-vendor': ['@tanstack/react-query', '@supabase/supabase-js'],
          
          // Utilities and icons
          'utils-vendor': ['lucide-react', 'clsx', 'tailwind-merge', 'date-fns'],
          
          // Heavy widget components
          'widget-heavy': [
            './src/components/Applets/MapWidget',
            './src/components/Applets/AudioPlayer',
            './src/components/Applets/VoiceAgentWidget',
            './src/components/Applets/AnalyticsDashboard'
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Increase limit for vendor chunks
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: mode === 'development',
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      '@tanstack/react-query',
      '@supabase/supabase-js'
    ],
  },
}));
