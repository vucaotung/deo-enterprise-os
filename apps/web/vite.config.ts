import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Vite proxy keeps the Worker Console same-origin with Paperclip so
// better-auth session cookies flow through without CORS gymnastics.
// PAPERCLIP_URL defaults to the local dev server (port 3100).

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const paperclip = env.PAPERCLIP_URL || 'http://localhost:3100';
  const paperclipWs = paperclip.replace(/^http/, 'ws');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
      port: 5173,
      proxy: {
        '/api/companies': {
          target: paperclipWs,
          ws: true,
          changeOrigin: true,
        },
        '/api': {
          target: paperclip,
          changeOrigin: true,
        },
        '/auth': {
          target: paperclip,
          changeOrigin: true,
        },
      },
    },
  };
});
