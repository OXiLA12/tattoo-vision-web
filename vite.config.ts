import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    // lucide-react must be PRE-BUNDLED (not excluded) to avoid hundreds
    // of individual module requests that cause ERR_INSUFFICIENT_RESOURCES
    include: ['lucide-react'],
  },
});
