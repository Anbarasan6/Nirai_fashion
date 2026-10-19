import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      react(),
      tailwindcss(),
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@sentry')) {
                return 'vendor-sentry';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react-router') || id.includes('react-router-dom')) {
                return 'vendor-router';
              }
              if (
                id.includes('/node_modules/react/') ||
                id.includes('\\node_modules\\react\\') ||
                id.includes('/node_modules/react-dom/') ||
                id.includes('\\node_modules\\react-dom\\') ||
                id.includes('/node_modules/scheduler/') ||
                id.includes('\\node_modules\\scheduler\\')
              ) {
                return 'vendor-react';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
              if (id.includes('qrcode')) {
                return 'vendor-qrcode';
              }
              if (id.includes('zod')) {
                return 'vendor-zod';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
