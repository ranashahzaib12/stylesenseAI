import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy /api calls to the local Express backend during development.
          // When VITE_MODAL_URL is set, the frontend calls Modal directly and
          // this proxy is not used.
          '/api': {
            target: 'http://localhost:8787',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.OPENAI_API_KEY': JSON.stringify(process.env.OPENAI_API_KEY || env.OPENAI_API_KEY),
        // AR Try-On: Modal GPU endpoint (set for production / direct calls)
        'process.env.VITE_MODAL_URL': JSON.stringify(env.VITE_MODAL_URL || ''),
        // AR Try-On: Express backend URL (only needed if NOT using VITE_MODAL_URL)
        'process.env.VITE_BACKEND_URL': JSON.stringify(env.VITE_BACKEND_URL || ''),
      },
      build: {
        chunkSizeWarningLimit: 600,
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('modelParams.json')) return 'ml-model-data';
              if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('openai')) return 'vendor-openai';
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
