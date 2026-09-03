import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // og-image.png no entra: solo la piden los crawlers cuando alguien
      // comparte el link, y precachearla costaba 199KB en la primera carga
      // de una app que se abre en la sobremesa.
      includeAssets: ['favicon-32.png', 'apple-touch-icon.png'],
      workbox: {
        // Cachear también Google Fonts para que Outfit y Fredoka funcionen offline.
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 12, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'Word Blitz',
        short_name: 'Word Blitz',
        description:
          'El juego de palabras para jugar en familia: letra, categoría y tiempo. El celu es el control, la TV es el tablero.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        background_color: '#0c1a37',
        theme_color: '#0c1a37',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
