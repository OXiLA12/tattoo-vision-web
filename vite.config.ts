import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // lucide-react must be PRE-BUNDLED (not excluded) to avoid hundreds
    // of individual module requests that cause ERR_INSUFFICIENT_RESOURCES
    include: ['lucide-react'],
    // Native-only Capacitor plugins must never be pre-bundled for the web build
    exclude: ['@revenuecat/purchases-capacitor', '@capacitor/browser'],
  },
  build: {
    rollupOptions: {
      // Keep native-only packages out of the web bundle entirely.
      // They are only loaded via dynamic import() inside isNativePlatform() guards,
      // so they are never actually fetched when running in a browser.
      external: ['@revenuecat/purchases-capacitor', '@capacitor/browser'],
    },
  },
});
