import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { cspManager } from "./src/lib/security/cspConfig";

// Security plugin for Vite
const securityPlugin = () => {
  return {
    name: 'security-headers',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // Apply security headers in development
        const isDevelopment = process.env.NODE_ENV === 'development';
        const headers = cspManager.getSecurityHeaders(isDevelopment);
        
        Object.entries(headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
        
        next();
      });
    },
    transformIndexHtml(html: string) {
      // Generate and inject CSP nonce
      const nonce = cspManager.generateNonce();
      const isDevelopment = process.env.NODE_ENV === 'development';
      const cspHeader = cspManager.getCSPHeader(isDevelopment);
      
      // Inject CSP meta tag
      const cspMeta = `<meta http-equiv="Content-Security-Policy" content="${cspHeader}">`;
      
      // Inject nonce into scripts
      let modifiedHtml = html.replace(
        '<head>',
        `<head>\n    ${cspMeta}`
      );
      
      // Add nonce to module scripts
      modifiedHtml = modifiedHtml.replace(
        /<script type="module"/g,
        `<script type="module" nonce="${nonce}"`
      );
      
      return modifiedHtml;
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    securityPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Security-focused build options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },
    // Split chunks for better security isolation
    rollupOptions: {
      output: {
        manualChunks: {
          'security': ['dompurify', 'crypto-js'],
          'vendor': ['react', 'react-dom'],
          'ui': ['@radix-ui/react-dialog', '@radix-ui/react-button'],
        },
      },
    },
  },
}));
