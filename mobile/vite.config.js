import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name:             'SpotBlitz Controller',
        short_name:       'SpotBlitz',
        description:      'Multiplayer spotting game controller',
        theme_color:      '#7c3aed',
        background_color: '#0a0b14',
        display:          'standalone',
        orientation:      'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5174,
  },
});
